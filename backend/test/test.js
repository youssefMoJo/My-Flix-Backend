const assert = require('assert');
const axios = require('axios');
const User = require("../schemas/User")
const myurl = 'http://localhost:3000/myFlex/api/v1/';

const instance = axios.create({
    baseURL: myurl,
    timeout: 5000,
    headers: { 'content-type': 'application/json' }
});

const makeUser = (email, username, password, returnObj = false) => {
    let userObj = { email, username, password }
    if (returnObj) {
        return userObj
    }
    let user = new User(userObj)
    return user
}
let allUserTokens = []
let userToken = allUserTokens[allUserTokens.length - 1]

describe("User Schema", () => {
    let user = makeUser("youssef@yahoo.com", "youssef", 123, returnObj = false)
    it("Success 1. Test creation of a valid user with parameters matching", () => {
        assert.equal(user.username, "youssef")
        assert.equal(user.email, "youssef@yahoo.com")
        assert.equal(user.password, 123)
    })
    it("Success 2. Test that the DB creates an empty movies and tokens list", () => {
        assert.equal(user.movies.length, 0)
        assert.equal(user.tokens.length, 0)
    })
})

describe("Test API calls", () => {
    describe("Test sign up:", () => {
        it('Success 1. POST - Test passing valid user (signing up first time)', async () => {
            // Setting up the user
            let userData = makeUser("youssef@yahoo.com", "youssef", "123", returnObj = true)
            let res = await instance.post('/signup', userData);
            if (res.data.errorMessage != undefined) {
                assert.fail("You can't sign up with the same username or email");
            }
            // Setting up the user tokens globally for testing purposes
            allUserTokens.push(res.data.user.tokens[0].token)
            userToken = allUserTokens[allUserTokens.length - 1]
            assert.strictEqual(res.data.successMessage, "user signed up successfully")
        })
        it('Fail 1. POST - Test passing invalid email in the object', async () => {
            // Setting up the user
            let userData = makeUser("youssef1@#$.c@om", "youssef211", "123", returnObj = true)
            let res = await instance.post('/signup', userData);
            assert.strictEqual(res.data.errorMessage, "INVALID_EMAIL")
        })
        it('Fail 2. POST - Test passing email exists in the database', async () => {
            // Setting up the user
            let userData = makeUser("youssef@yahoo.com", "youssef1", "123", returnObj = true)
            let res = await instance.post('/signup', userData);
            assert.strictEqual(res.data.errorMessage, "EMAIL_EXISTS")
        })
        it('Fail 3. POST - Test passing username exists in the database', async () => {
            // Setting up the user
            let userData = makeUser("youssef1@yahoo.com", "youssef", "123", returnObj = true)
            let res = await instance.post('/signup', userData);
            assert.strictEqual(res.data.errorMessage, "USERNAME_EXISTS")
        })
    })

    describe("Test Log in:", () => {
        it("Fail 1. POST - Test passing wrong email in the object", async () => {
            // Setting up the user
            let userData = makeUser("wrongYoussef@yahoo.com", null, "123", returnObj = true)
            let res = await instance.post('/login', userData);
            assert.strictEqual(res.data.errorMessage, "UNABLE_TO_LOGIN")
        })
        it("Fail 2. POST - Test passing wrong username in the object", async () => {
            // Setting up the user
            let userData = makeUser(null, "wrongYoussef", "123", returnObj = true)
            let res = await instance.post('/login', userData);
            assert.strictEqual(res.data.errorMessage, "UNABLE_TO_LOGIN")
        })
        it("Fail 3. POST - Test passing wrong password in the object", async () => {
            // Setting up the user
            let userData = makeUser("youssef@yahoo.com", "youssef", "wrongPassword", returnObj = true)
            let res = await instance.post('/login', userData);
            assert.strictEqual(res.data.errorMessage, "UNABLE_TO_LOGIN")
        })
        it("Success 1. POST - Test logging in with correct email and password", async () => {
            // Setting up the user
            let userData = makeUser("youssef@yahoo.com", null, "123", returnObj = true)
            let res = await instance.post('/login', userData);
            // Setting up the user tokens globally for testing purposes
            allUserTokens.push(res.data.user.tokens[res.data.user.tokens.length - 1].token)
            userToken = allUserTokens[allUserTokens.length - 1]
            assert.strictEqual(res.data.successMessage, "user logged in successfully")
        })
        it("Success 2. POST - Test logging in with correct username and password", async () => {
            // Setting up the user
            let userData = makeUser(null, "youssef", "123", returnObj = true)
            let res = await instance.post('/login', userData);
            // Setting up the user tokens globally for testing purposes
            allUserTokens.push(res.data.user.tokens[res.data.user.tokens.length - 1].token)
            userToken = allUserTokens[allUserTokens.length - 1]
            assert.strictEqual(res.data.successMessage, "user logged in successfully")
        })
    })

    describe("Test get your profile:", () => {
        it("Fail 1. GET - Test passing wrong token in the object", async () => {
            // I will not repeat testing the (wrong token) because that error happens in 
            // a middleware called (auth). That authenticates the user to allow
            // him do some tasks. And it has nothing to do with the end point. So there
            // is no need to test that in the following end points.
            let res = await instance.get('/user', {
                params: {
                    "token": userToken + "wrong addidtion"
                }
            });

            assert.strictEqual(res.data.errorMessage, "UNAUTHORIZED")
        })
        it("Success 1. GET - Test passing correct token in the object", async () => {
            let res = await instance.get('/user', {
                params: {
                    "token": userToken
                }
            });
            assert.strictEqual(res.data.successMessage, "received my profile")
        })
    })

    describe("Test Add a movie to your list: ", () => {
        it("fail 1. PATCH - Test adding nothing in the correct user's list", async () => {
            let res = await instance.patch('/user/list', {
                "token": userToken,
                "id": null,
                "watched": null,
                "rating": null
            });
            assert.strictEqual(res.data.errorMessage, "something went wrong, try again later!")
        })
        it("Success 1. PATCH - Test adding valid movie id in the correct user's list", async () => {
            let res = await instance.patch('/user/list', {
                "token": userToken,
                "id": 123,
                "watched": true,
                "rating": 3
            });
            if (res.data.successMessage != "Movie Added Succecfully") {
                assert.fail("You can't add the same movie twice in your list but any changes will be saved and this is what i'm testing in the success 2 ;)");
            }
            assert.strictEqual(res.data.successMessage, "Movie Added Succecfully")
        })
        it("Success 2. PATCH - Test editing valid movie id existing in the correct user's list", async () => {
            // change the watched states to false
            let res = await instance.patch('/user/list', {
                "token": userToken,
                "id": 123,
                "watched": false,
                "rating": 3
            });
            assert.strictEqual(res.data.successMessage, "The movie is already in your list and any new changes is saved :)")
        })
    })

    describe("Test Get my movies list: ", () => {
        it("Success 1. GET - Test passing correct token and get user's movies list", async () => {
            let res = await instance.get('/user/list', {
                params: {
                    "token": userToken
                }
            });
            assert.strictEqual(res.data.successMessage, "received my list succecfully")
        })
    })

    describe("Test remove a movie from your list: ", () => {
        it("Success 1. REMOVE - Test passing correct token and valid movie id", async () => {
            let res = await instance.delete('/user/list', {
                params: {
                    "token": userToken,
                    "id": 123
                }
            });
            assert.strictEqual(res.data.successMessage, "Movie removed Succecfully")
        })
        it("fail 1. REMOVE - Test passing correct token and valid movie id for a movie that has removed from the database", async () => {
            let res = await instance.delete('/user/list', {
                params: {
                    "token": userToken,
                    "id": 123
                }
            });
            assert.strictEqual(res.data.errorMessage, "The movie is already removied")
        })
    })

    describe("Test Log out: ", () => {
        it("Success 1. POST - Test correct token in the object", async () => {
            let res = await instance.post('/logout', { "token": userToken });
            assert.strictEqual(res.data.successMessage, "logger out successfully")
        })
    })
})