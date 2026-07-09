"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5001;
// Middlewares
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
// Healthcheck
app.get('/health', (req, res) => {
    const response = {
        success: true,
        message: 'Server is healthy',
        data: {
            status: 'UP',
            uptime: process.uptime(),
        },
    };
    res.status(200).json(response);
});
// Start Server
app.listen(PORT, () => {
    console.log(`[ShopSphere API] Server running on port ${PORT}`);
});
//# sourceMappingURL=index.js.map