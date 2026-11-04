// 导入 MCP 客户端类，负责与 MCP 服务器通信
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
// 导入基于标准输入输出（stdio）的传输层，用于启动并连接 MCP 服务器子进程
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

// 定义异步函数 listTools：连接 MCP 服务器并获取其工具列表
async function listTools({
  command,        // 启动 MCP 服务器的命令，如 "npx"
  args,           // 命令参数数组，如 ["-y", "@modelcontextprotocol/server-filesystem"]
  env = {},       // 可选的环境变量，默认为空对象
}: {
  command: string;                    // command 的类型：字符串
  args: string[];                     // args 的类型：字符串数组
  env?: Record<string, string>;       // env 的类型：可选的键值对对象
}) {
  // 创建 stdio 传输层：执行 command + args 启动服务器子进程，并建立通信管道
  const transport = new StdioClientTransport({
    command,                          // 要执行的命令
    args,                             // 命令的参数
    env: {
      // 展开当前进程的全部环境变量（继承父进程环境）
      ...(process.env as Record<string, string>),
      // 再用传入的 env 覆盖或追加指定的环境变量
      ...env,
    },
  });

  // 创建 MCP 客户端实例，name 和 version 是客户端的自我标识信息
  const client = new Client({
    name: "chatmcp",                  // 客户端名称
    version: "1.0.0",                 // 客户端版本
  });

  // 建立与 MCP 服务器的连接（完成协议握手和能力协商）
  await client.connect(transport);

  // 向服务器发送 tools/list 请求，获取它定义的所有工具清单
  const tools = await client.listTools();

  // 返回获取到的工具列表
  return tools;
}



export { listTools };