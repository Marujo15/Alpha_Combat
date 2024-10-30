import jwt from "jsonwebtoken";
import { SECRET_KEY } from "../config/index.js";

if (!SECRET_KEY) {
    throw new Error("SECRET_KEY is not defined");
}

export const authenticateJWT = (req, res, next) => {
    const token = req.cookies.session_id;

    if (!token) {
        res.status(401).json({ message: "Access Denied" });
        return;
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            res.status(400).json({ message: "Invalid jwt Token" });
            return;
        }

        req.user = decoded.id;
        next();
    });
};
