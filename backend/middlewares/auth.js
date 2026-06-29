import jwt from 'jsonwebtoken'

export const protect = async (req, res, next) => {
    try {
        let token;
        console.log("Req.headers: ", req.headers);
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer")
        ) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Not authorized"
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET
        );

        req.user = decoded;

        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Token invalid or expired"
        });
    }
};


export const authorize = (...roles) => {
    return (req, res, next) => {
        try {
            if(!req.user) {
                return req.status(401).json({
                    success: false,
                    message: "Unauthorized"
                });
            }
            if (!roles.includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    message: "Access denied"
                });
            }
            next();
        } catch(error) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }


}