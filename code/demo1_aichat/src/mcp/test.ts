// src/mcp/test.ts
import { listTools } from "./listTools";

// 示例：列出 npx 官方文件系统 MCP 服务器提供的工具
const tools = await listTools({
  command: "npx",
  args: ["-y", "@modelcontextprotocol/server-filesystem", "E:\\Project"],
});

console.log(JSON.stringify(tools, null, 2));



// # Node 20.6+ 原生支持 TypeScript 语法有限，推荐两种方式：

// # 方式一：使用 tsx（最简单，推荐）
// npm i -D tsx
// npx tsx src/mcp/test.ts
// npx tsx src/mcp/test.ts

// # 方式二：使用 ts-node
// npm i -D ts-node typescript
// npx ts-node src/mcp/test.ts