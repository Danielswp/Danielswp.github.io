import os
import httpx
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()
client = OpenAI(
    api_key="",
    base_url="https://open.bigmodel.cn/api/paas/v4",
    #base_url="https://api.deepseek.com",
    http_client=httpx.Client(verify=False)   # 警用SSL证书验证
)

response = client.chat.completions.create(
    #model="deepseek-chat",
    model="glm-5.3-flash",
    messages=[
        {"role":"system", "content":"You are a helpful assistant"},
        {"role":"user", "content":"Hello,你好"}
    ],
    max_tokens=1024,
    temperature=0.7,
    stream=False   # 关闭流式输出
)

print(response.choices[0].message.content)