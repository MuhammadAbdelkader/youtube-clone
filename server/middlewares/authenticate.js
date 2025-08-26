const User = require("../models/user.model");
const { verifyToken } = require("../utils/jwt");
const authenticate = async (req, res, next) => {
    const { token } = req.headers;
    if (!token) {
        throw new Error("you are not authenticated", { cause: 401 });
    }
    let payLoad = verifyToken(token, process.env.JWT_ACCESS_SECRET);
    if (!payLoad) {
        throw new Error("invalid token", { cause: 401 });
    }
    let user = await User.findById(payLoad.userId);
    if (!user) {
        throw new Error("User Not Found", { cause: 404 });
    }
    req.user = payLoad;
    next();
};
module.exports = authenticate;