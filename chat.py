from flask import Flask, render_template, request, jsonify
import openai
import os

app = Flask(__name__)

# 设置你的OpenAI API密钥
openai_api_key = os.getenv("OPENAI_API_KEY")
if openai_api_key is None:
    raise ValueError("OpenAI API key is not set. Please set it as environment variable OPENAI_API_KEY=xxx.")

# 初始化ChatGPT模型
model = "gpt-3.5-turbo"

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    messages = data.get("messages", [])
    print("--->", messages)

    # 使用ChatGPT模型进行对话
    response = openai.ChatCompletion.create(
        model=model,
        messages=messages
    )

    print("<---", response)

    # 获取模型的回复
    model_reply = response["choices"][0]["message"]["content"]

    return jsonify({"message": model_reply})


if __name__ == "__main__":
    app.run(debug=True)
