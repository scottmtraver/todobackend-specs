var chai = require('chai'),
    shouls = chai.should,
    expect = chai.expect,
    Promise = require('bluebird'),
    request = require('superagent-promise')(require('superagent'), Promise),
    chaiAsPromised = require('chai-as-promised')

chai.use(chaiAsPromised)

var url = process.env.URL || 'http://localhost:8000/todos'

// Tests
describe('Cross Origin Request', function () {
    var result

    before(function () {
        result = request('OPTIONS', url)
            .set('Origin', 'http://someplace.com')
            .end()
    })

    it('should return the correct CORS headers', function () {
        return assert(result, 'header').to.contain.all.keys([
            'access-control-allow-origin',
            'access-control-allow-methods',
            'access-control-allow-headers',
        ])
    })

    it('should allow all origins', function () {
        const header = assert(result, 'header')
        header.then((h) => {
            expect(h['access-control-allow-origin']).to.equal('*')
        })
    })

})

describe('Create Todo Item', function () {
    var result

    before(function () {
        result = post(url, { title: 'Walk the dog' })
    })

    it('should return a 201 GREATED response', function () {
        return assert(result, 'status').to.equal(201)
    })

    it('should receive a location hyperlink', function () {
        const header = assert(result, 'header')
        header.then((h) => {
            expect(h['location']).to.match(/^https?:\/\/.+\/todos\/[\d]+$/)
        })
    })

    it('should create the item', function () {
        const header = assert(result, 'header')
        const item = header.then((h) => {
            return get(h['location'])
        })
        item.then((newItem) => {
            expect(newItem.body.title).to.equal('Walk the dog')
        })
    })
})

describe('Update Todo Item', function () {
    var location

    beforeEach(function (done) {
        post(url, { title: 'Walk the dog' }).then((item) => {
            location = item.header.location
            done()
        })
    })

    it('should have completed set to true after PUT update', function () {
        update(location, 'PUT', { completed: true }).then((result) => {
            expect(result.body.completed).to.equal(true)
        })
    })

    it('should have completed set to true after PUT update', function () {
        update(location, 'PATCH', { completed: true }).then((result) => {
            expect(result.body.completed).to.equal(true)
        })
    })
})

describe('Delete Todo Item', function () {
    var location

    beforeEach(function (done) {
        post(url, { title: 'Walk the dog' }).then((item) => {
            location = item.header.location
            done()
        })
    })

    it('should return a 204 NO CONTENT response', function () {
        del(location).then((response) => {
            expect(response.status).to.equal(204)
        })
    })

    it('should have deleted the item', function () {
        del(location).then(() => {
            expect(get(location)).to.eventually.be.rejectedWith('Not Found')
        })
    })
})


// Util functions
function post(url, data) {
    return request.post(url)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .send(data)
        .end()
}

function get(url) {
    return request.get(url)
        .set('Accept', 'application/json')
        .end()
}


function del(url) {
    return request.del(url)
        .end()
}

function update(url, method, data) {
    return request(method, url)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .send(data)
        .end()
}

function assert(result, prop) {
    return expect(result).to.eventually.have.deep.property(prop)
}
