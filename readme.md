# AI角色扮演网站
此为运行程序的说明，架构设计文档（包含模块介绍以及题目中的思考题）请见```document.md```，demo视频请见```demo.md```。
## 🚀 快速开始

### 1. 先决条件

* 安装 [Node.js](https://nodejs.org/) (v18 或更高版本)。
* 获取 **智谱AI** API（本项目调用免费模型）
* 获取 [open-edge-tts](https://github.com/travisvn/openai-edge-tts)，按照说明运行并确保端口开放在```5050```。安装方法也可参照https://zhuanlan.zhihu.com/p/19099104687。
* 建议使用Edge打开网站，因为Chrome浏览器自带的语音识别在国内无法使用。

### 2. 安装

1.  **克隆仓库**
    ```bash
    git clone https://github.com/Hongxiao-Chen/Qiniu-Project.git
    cd Qiniu-Project
    ```

2.  **安装后端依赖**
    ```bash
    cd backend
    npm install
    ```

3.  **安装前端依赖**
    ```bash
    cd ../frontend
    npm install
    ```

### 3. 配置环境变量

1.  在 `backend` 目录下，创建一个名为 `.env` 的新文件。
2.  将以下内容复制到 `.env` 文件中，并替换为你的密钥信息：

    ```env
    ZHIPU_API_KEY="<你的智谱AI API密钥>"
    TTS_API_URL="http://localhost:5050/v1/audio/speech"
    TTS_API_KEY="<自行设置的TTS API密钥>"
    ```

### 4. 运行应用

你需要**同时运行**前端和后端服务，以及另外运行```open-edge-tts```（方法请参照原仓库）。请打开两个终端窗口。

* **终端 1: 启动后端服务**
    ```bash
    cd backend
    npm start
    ```
    > 后端服务将在 `http://localhost:3001` 启动。

* **终端 2: 启动前端开发服务器**
    ```bash
    cd frontend
    npm run dev
    ```
    > 前端应用将在 `http://localhost:5173` (或 Vite 提示的另一个端口) 启动。

现在，在你的浏览器（如果在国内，请用Edge或IE
打开）中打开前端地址 (例如 `http://localhost:5173`) 即可开始使用。