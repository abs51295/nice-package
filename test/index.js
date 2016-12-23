const expect = require('chai').expect
const Package = require('..')
const semver = require('semver')
const fixtures = require('require-dir')('./fixtures')

describe('Package', () => {
  var pkg = new Package(fixtures.express)

  it('has basic properties', () => {
    expect(pkg.name).to.equal('express')
    expect(pkg.description).to.exist
    expect(pkg.version).to.exist
    expect(pkg.readme).to.exist
  })

  it('turns `users` object into a star count', () => {
    expect(pkg.stars).to.be.above(1500)
  })

  it('turns `time` into a versions object', () => {
    expect(pkg.versions.length).to.be.above(20)
    expect(pkg.versions.every(version => version.number.length > 0)).to.be.true
    expect(pkg.versions.every(version => !!semver.valid(version.number))).to.be.true
    expect(pkg.versions.every(version => version.date.length > 0)).to.be.true
  })

  it('preserves timestamps', () => {
    expect(pkg.created).to.exist
    expect(pkg.modified).to.exist
  })

  it('renames `maintainers` to `owners`', () => {
    expect(pkg.maintainers).to.not.exist
    expect(pkg.owners.find(owner => owner.name === 'dougwilson')).to.exist
  })

  it('renames `_npmUser` to `lastPublisher`', () => {
    expect(pkg.lastPublisher).to.exist
    expect(pkg._npmUser).to.not.exist
  })

  it('removes unwanted props', () => {
    expect(pkg.directories).to.not.exist
    expect(pkg.bugs).to.not.exist
    expect(pkg._id).to.not.exist
    expect(pkg._shasum).to.not.exist
    expect(pkg._from).to.not.exist
  })

  describe('convenience functions', () => {
    it('dependsOn()', () => {
      expect(pkg.dependsOn('finalhandler')).to.be.true
      expect(pkg.dependsOn('monkeys')).to.be.false
    })

    it('devDependsOn()', () => {
      expect(pkg.devDependsOn('istanbul')).to.be.true
    })

    it('somehowDependsOn()', () => {
      expect(pkg.somehowDependsOn('finalhandler')).to.be.true
      expect(pkg.somehowDependsOn('istanbul')).to.be.true
    })

    it('depNames getter', () => {
      expect(pkg.depNames).to.include('finalhandler')
    })

    it('devDepNames getter', () => {
      expect(pkg.devDepNames).to.include('istanbul')
    })

    it('allDepNames getter', () => {
      expect(pkg.allDepNames).to.include('finalhandler')
      expect(pkg.allDepNames).to.include('istanbul')
    })

    it('mentions()', () => {
      expect(pkg.mentions('minimalist web framework')).to.be.true
      expect(pkg.mentions('MINIMALIST WEB FRAMEWORK')).to.be.true
    })
  })

  describe('validation', () => {
    it('is valid if all required properties are present', () => {
      expect(pkg.valid).to.be.true
    })

    it('requires description', () => {
      const oldDescription = pkg.description
      delete pkg.description
      expect(pkg.valid).to.be.false
      expect(pkg.validationErrors.length).to.equal(1)
      expect(pkg.validationErrors[0].property).to.equal('description')
      pkg.description = oldDescription
    })

    it('requires name', () => {
      const oldName = pkg.name
      delete pkg.name
      expect(pkg.valid).to.be.false
      expect(pkg.validationErrors.length).to.equal(1)
      expect(pkg.validationErrors[0].property).to.equal('name')
      pkg.name = oldName
    })
  })

  describe('pick', () => {
    it('accepts an array of props to pick', () => {
      const opts = {pick: ['name', 'description']}
      const pickedPackage = new Package(pkg, opts)
      expect(Object.keys(pickedPackage)).to.deep.equal(['name', 'description'])
    })

    it('accepts a comma-delimited string of props to pick', () => {
      const opts = {pick: 'name, description'}
      const pickedPackage = new Package(pkg, opts)
      expect(Object.keys(pickedPackage)).to.deep.equal(['name', 'description'])
    })
  })

  describe('omit', () => {
    it('accepts an array of props to omit', () => {
      const opts = {omit: ['description']}
      const omittedPackage = new Package(pkg, opts)
      const props = Object.keys(omittedPackage)
      expect(props).to.include('name')
      expect(props).to.not.include('description')
    })

    it('accepts an comma-delimited string of props to pick', () => {
      const opts = {omit: 'description, name'}
      const omittedPackage = new Package(pkg, opts)
      const props = Object.keys(omittedPackage)
      expect(props).to.not.include('name')
      expect(props).to.not.include('description')
      expect(props).to.include('versions')
    })
  })

  it('can reconstitute packages from an already-cleaned package object', () => {
    const repkg = new Package(pkg)
    expect(repkg.name).to.equal('express')
  })

  it('accepts package.json data instead of registry data', () => {
    const packageJSONPackage = new Package(fixtures.spectron)
    expect(packageJSONPackage.name).to.equal('spectron')
    expect(packageJSONPackage.dependsOn('webdriverio')).to.be.true
  })

  it('accepts incomplete package.json data but still exposes convenience methods', () => {
    const sparsePackage = new Package(fixtures.sparse)
    expect(sparsePackage.name).to.not.exist
    expect(sparsePackage.valid).to.be.false
    expect(sparsePackage.dependsOn('request')).to.be.true
  })

  describe('repository', () => {
    it('turns GitHub `repository` entry into an HTTPS URL string', () => {
      const gitty = new Package(fixtures.express)
      expect(gitty.repository).to.equal('https://github.com/expressjs/express')
    })

    it('retains original repository structure for non-GitHub URLs', () => {
      const bitty = new Package(fixtures.bitbucket)
      expect(bitty.repository.type).to.equal('git')
      expect(bitty.repository.url).to.equal('https://bitbucket.org/monkey/business.git')
    })
  })

  it('ignores the `valid` property, if present, in favor of internal getter', () => {
    const fakeValidPkg = new Package(fixtures['disallowed-valid-property'])
    expect(fakeValidPkg.valid).to.be.true
  })

  it('does not throw an error when passed a null doc', () => {
    const fn = function () {
      var pkg = new Package(null)
      pkg
    }
    expect(fn).to.not.throw
  })
})
