# Model Context Protocol(MCP)

Anthropic公司推出的AI通用接口，对接Claude,ChatGPT

桥接对象：AI聊天、IDEs、数据库、开发工具（Git）、生产工具（Google Map）以及其他AI接口

# MCP能够使能什么？

- 笔记软件的AI助手

- Claude Code生成网页应用

- 企业聊天机器人对接数据库

- 用Blender的3D设计模型打印

# MCP核心概念

- Resources:类似文件的数据可以被客户端读取的

- Tools：可以被大语言模型调用的函数

- Prompts：提示词，帮助用户完成特定任务

# MCP架构：Host-Client-Server （主机-客户端-服务器）

- Host：AI 应用本身，比如 Claude Desktop 或者你写的聊天程序
- Client：Host 派出去的“跑腿员”，专门负责跟一个服务器联系
- Server：干活的，提供具体工具（比如读文件、查数据库）

打个比方：

```
你（Host）→ 打电话（Client）→ 客服（Server）
```

* 一个 Host 可以派多个 Client，各连各的 Server，AI 就能用上各种工具了。

* MCP 协议是 Client 和 Server 之间的沟通协议

![](./MCP/mcp-architecture.jpg)

  ![](./MCP/mcp-architecture2.jpg)

# 函数调用 vs RAG vs MCP

- 函数调用：调用各种工具的方式

- RAG：检索文件的方式

- MCP：调用统一工具



# OSI层级

JSONRPC 和 MCP都是应用层，下面http，stdio的传输层支持。









# 开启服务器

uv run python weather_server.py

# 测试

uv run fastmcp inspector weather_server.py

http://localhost:5173

# 测试 get_alerts

uv run fastmcp call weather_server.py get_alerts state=CA

# 测试 get_forecast

uv run fastmcp call weather_server.py get_forecast latitude=39.74 longitude=-97.09

# 测试 test_mcp

uv run fastmcp call weather_server.py test_mcp word=gogogo
