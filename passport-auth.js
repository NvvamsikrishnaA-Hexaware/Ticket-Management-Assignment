require('dotenv').config()

const JWTstrategy = require('passport-jwt').Strategy;
const ExtractJWT = require('passport-jwt').ExtractJwt;

module.exports = function (passport) {
    passport.use(
        new JWTstrategy(
            {
                secretOrKey: process.env.ACCESS_TOKEN_SECRET,
                jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken()
            },
            async (data, done) => {
                try {
                    // console.log(data);
                    return done(null, data);
                } catch (error) {
                    done(error);
                }
            }
        )
    )
}