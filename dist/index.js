"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("./server");
const PORT = process.env.PORT || 3000;
server_1.app.listen(PORT, () => {
    console.log(`🚢 Now listening on 0.0.0.0:${PORT} 🔥`);
});
//# sourceMappingURL=index.js.map