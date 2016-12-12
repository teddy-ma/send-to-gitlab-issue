---
layout: home
---

# 从零开始编写一个 chrome 扩展

![webstore-extensions.jpg](http://upload-images.jianshu.io/upload_images/330-5a1a84ca8af8333a.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
Chrome 是 web 开发人员必备的浏览器没有之一。

要编写一个 chrome 浏览器扩展也只需要（基本的）html，js ，css 这些 web 开发的基本能力。

下面先看一下一个 chrome 扩展的项目结构吧：

```bash
├── images
│   ├── icon-128.png
│   └── icon-16.png
├── manifest.json
├── options.html
├── popup.html
└── scripts
    ├── background.js
```

从文件结构来看，其实所谓的 chrome 扩展也就是一个类似 webapp 的东西。

其中最重要的就是 `manifest.json` 这个配置文件了，其中包含了扩展的一些元数据，

包含名称，版本，图标，权限，各类入口文件等信息。

在上面的例子中，`options.html` 是配置项的界面，`popup.html` 是扩展弹出页的界面，而 `background.js` 相当于扩展的后台进程，可以独立执行逻辑或者给前端（popup）提供数据。

一般来说对于扩展或者插件类应用的编写采取任务驱动的方式是最适合的。下面我们就以一个『send to gitlab issue』的扩展为例，来讲解一下 chrome 扩展的开发流程。

这个扩展的功能类似于 [pocket](getpocket.com) 这个稍后阅读的服务，只不过 pocket 这类应用都只能对保存的网页做出『已读』或者『未读』的区分，而对于一篇技术文章，很难说到底读懂了多少，理解消化的程度让我很难把一篇技术文章标记为『已读』，这就造成了我的 pocket 中未读数量只增不减，到头来等于没有整理。

所以我打算写一个扩展，可以根据当前网页链接创建一个 [gitlab](https://gitlab.com/) 的 issue ，gitlab 的 issue 相对而言，可以有更大的空间做笔记，也可以很方便的直接把文章中的知识学以致用后和 gitlab 上托管的项目代码直接关联，而且 Milestone 配合 label 的分类也比 pocket 单纯的 tag 要强不少，更别提还能和别人一起讨论了。

那么先分析一下需求，作为一个用户，当我看到一篇不错的技术文章，我想把它记录到 gitlab 上，然后下班后仔细研读，做笔记，并和同事们讨论一下。于是我点击了 chrome 浏览器右上角的 『send to gitlab issue』图标，弹出了一个小页面，里面预先填好了文章的标题和 url，我可以稍微修改（或不做），然后点击保存，那么这篇文章就被记录到（预先配置好的）gitlab 服务器上了。

对于这样一个小项目，可以先从一个最简的 demo 开始，先让扩展在浏览器上『占有一席之地』，然后点击后可以弹出一个小的 ui 界面。

别急着创建配置文件和 html 页面，懒惰是程序员的一种美德，先使用 [这个](https://github.com/yeoman/generator-chrome-extension) 基于 [yeoman](http://yeoman.io/) 的 chrome 扩展 generator 来生成项目骨架（还支持 es2015 哦）。

然后在 `manifest.json` 中指定扩展的弹出页面文件：

```json
"browser_action": {
  "default_popup": "popup.html"
}
```

然后创建 `popup.html` 文件，编写 html 内容，一般样式文件直接在 header 中即可，而 js 文件 *必须* 从外部引用，不能直接写在 html 中。

```html
<body>
  <p id="flash">

  </p>
  <input type="text" id="popup_title" placeholder="标题"/>
  <textarea type="text" id="popup_url" placeholder="url">
  </textarea>
  <br />
  <button type="button" id="popup_button">发送</button>
  <script src="scripts/app.js"></script>
</body>
```

现在可以打开 chrome 浏览器的扩展管理页面，如图勾选载入开发中的扩展，选定项目的 `app` 目录，就能看到浏览器的右上角出现了我们正在开发的扩展了。

![load-extension.png](http://upload-images.jianshu.io/upload_images/330-e44796101f28e6f8.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

一切顺利的话，点击图标，就会出现我们编写的 html 页面了。

![popup.png](http://upload-images.jianshu.io/upload_images/330-badfdc9f0910e597.gif?imageMogr2/auto-orient/strip)

好了让我们进入下一步，获取当前页面的标题和 url。很明显这两个数据需要通过 chrome 提供的接口才能获取，这里我本来采用的是在 `background.js` 中直接去获取 dom 树的内容，可是测试后发现，`background.js` 获取的总是第一个页面的内容，当切换 tab 页后数据也不会改变。结果还是老老实实地看文档，找到了下面的这段代码：

```javascript
chrome.tabs.query({
  active: true,
  currentWindow: true
}, (tabs) => {
  document.getElementById('popup_title').value = tabs[0].title;
  document.getElementById('popup_url').value = tabs[0].url;
});
```

chrome 提供了获取当前激活的 tab 页面的接口，于是我们就能获取到当前 tab 页的 title 和 url 了， 顺便把他们自动填充到页面的 input 框中。

注意这里需要配置扩展的权限，加入对 tab 的访问权限才行，在 `manifest.json` 中加入：

```json
"permissions": ["tabs"]
```

之后的工作就是把 input 框的内容传递给 gitlab 了，关于 gitlab 的接口调用不是本文重点，可以直接参考官方的文档。gitlab 对外暴露 RESTful 的 http 接口，不需要任何 sdk 也可以很方便地调用。

```javascript
document.getElementById('popup_button').addEventListener('click', function() {
  createGitlabIssue(localStorage.options_project_id,
    document.getElementById('popup_title').value,
    document.getElementById('popup_url').value)
});
```

一开始我先把 gitlab 相关配置都硬编码到了扩展中，跑通流程后当然就不能直接就这样提交，需要把它们做成配置项。

chrome 扩展可以自定义一个配置页面，在 `manifest.json` 中加入：

```json
"options_page": "options.html",
```

然后创建 `options.html` 文件，并编写 html 内容：

```html
<body>
  <p id="flash"></p>
  gitlab host: <input type="text" id="options_host" placeholder="gitlab host" />
  <br />
  project id: <input type="text" id="options_project_id" placeholder="project id" />
  <br />
  private token: <input type="text" id="options_token" placeholder="private token" />
  <br />
  <button type="button" id="options_save">save</button>
  <script src="scripts/options.js"></script>
</body>
```

![options.png](http://upload-images.jianshu.io/upload_images/330-2ccc91cf42b1d1ba.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

然后编写 `options.js` 文件，把配置项持久化到 localStorage 中：

```javascript
var options_host = localStorage.options_host
document.getElementById('options_host').value = options_host;
var options_project_id = localStorage.options_project_id
document.getElementById('options_project_id').value = options_project_id;
var options_token = localStorage.options_token
document.getElementById('options_token').value = options_token;

document.getElementById('options_save').onclick = function() {
  localStorage.options_host = document.getElementById('options_host').value;
  localStorage.options_project_id = document.getElementById('options_project_id').value;
  localStorage.options_token = document.getElementById('options_token').value;
  document.getElementById('flash').innerHTML = '保存成功';
}
```

现在如果右键点击扩展的图标的话，就能看到『选项』这个菜单是可点击的：

![settings.png](http://upload-images.jianshu.io/upload_images/330-1c951dee1c4c4c38.gif?imageMogr2/auto-orient/strip)

然后在处理 gitlab 的 api 调用时，动态读取配置内容即可。

这样一来，一个简单的 chrome 扩展就这样完成了。当然还有很多细节需要打磨。

项目地址：<https://github.com/teddy-ma/send-to-gitlab-issue> ，欢迎各类 issue 和 pr。
