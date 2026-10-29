# Qt 工程文件（.pro）配置完全指南

> **导读**
>
> `.pro` 文件是 qmake 的工程描述文件，本质只有一句话：
>
> **一组变量赋值 + 一组条件判断。**
>
> qmake 读取 `.pro` 后，会据此生成 Makefile（在 Windows 上也可生成 MSVC 工程，在 macOS 上可生成 Xcode 工程）。所以写 `.pro` 不是"写脚本"，而是在**声明工程的结构与构建规则**。

1. 核心变量详解

---

本节按"是什么 → 怎么写 → 什么时候必须配"的顺序，逐个讲解最常用的变量。

### 1.1 `QT += ...` —— 声明要链接哪些 Qt 模块

`QT` 告诉 qmake：**本项目要用哪些 Qt 模块**。qmake 会据此自动完成三件事：

1. 添加该模块的头文件搜索路径（`-I...`）；

2. 添加链接库（`-lQt6Core`、`-lQt6Widgets` 等）；

3. 开启该模块必要的元对象处理规则（moc / uic / rcc）。

```
QT += core gui widgets                  # 标准界面程序
QT += network sql multimedia serialport # 按需追加
QT -= gui                               # 纯控制台程序，剔除 GUI 模块
```

**常用模块速查表**

| 模块                    | 提供的主要能力                      | 说明                                |
| ----------------------- | ----------------------------------- | ----------------------------------- |
| `core`                  | `QObject`、容器、信号槽、事件循环   | 默认包含，无需手写                  |
| `gui`                   | `QPainter`、`QImage`、窗口系统基础  | 默认包含                            |
| `widgets`               | `QPushButton`、`QMainWindow` 等控件 | **Qt5 起从 `gui` 拆出，写界面必加**​ |
| `network`               | TCP/UDP、HTTP、WebSocket            | 按需                                |
| `sql`                   | `QSqlDatabase`、`QSqlQuery`         | 按需                                |
| `serialport`            | 串口通信                            | 按需                                |
| `concurrent`            | `QtConcurrent` 并行算法             | 按需                                |
| `xml` / `xmlpatterns`   | XML 读写与 XQuery                   | 按需                                |
| `opengl` / `multimedia` | 图形渲染 / 音视频                   | 按需                                |
| `thread`                | 启用线程支持                        | Qt5及以上不需要                     |

> **⚠️ 经典坑**：界面程序只写了 `QT += core gui`，编译时报 `QWidget / QPushButton was not declared` —— 原因就是漏了 `widgets`。

### 1.2 `TARGET` —— 生成物的名字

`TARGET` 指定最终可执行文件或库的名称。

```
TARGET = MyApp      # Windows → MyApp.exe
                    # Linux   → MyApp（lib 模板则为 libMyApp.so）
                    # macOS   → MyApp.app
```

- **不写时默认取工程所在目录的名字**，单目录小项目可以省略；

- 需要发布、改名、或做多配置多目标工程时，应当显式写出。

### 1.3 `TEMPLATE` —— 决定"要构建成什么"

`TEMPLATE` 是整个 `.pro` 里**最关键的开关之一**，它决定 qmake 生成的构建规则类型。

| 取值      | 含义                         | 典型场景                      |
| --------- | ---------------------------- | ----------------------------- |
| `app`     | 生成可执行程序               | **默认值**，不写即为 `app`    |
| `lib`     | 生成动态库或静态库           | SDK、公共基础库               |
| `subdirs` | 本身不编译，只递归构建子目录 | 多模块大工程（见第 3 节）     |
| `aux`     | 不参与编译，仅用于文件管理   | Qt Creator 里当"虚拟文件夹"用 |

```
TEMPLATE = app        # 程序
TEMPLATE = lib        # 库
TEMPLATE = subdirs    # 父工程
SUBDIRS  = core gui app plugins tests
```

### 1.4 `CONFIG` —— 构建行为的"总开关"

`CONFIG` 用来叠加各种构建选项，可多次 `+=` / `-=` 修改。

```
CONFIG += c++17 qt warn_on release
CONFIG -= debug_and_release     # 关闭默认的双版本（debug + release）构建
```

**常用取值一览**

| 取值                                  | 作用                                                        |
| ------------------------------------- | ----------------------------------------------------------- |
| `c++11` / `c++14` / `c++17` / `c++20` | 指定 C++ 标准                                               |
| `debug` / `release`                   | 构建类型；配合 `debug_and_release` 可同时产出两版           |
| `debug_and_release`                   | 默认开启，分别生成 `debug/` 与 `release/` 目录              |
| `warn_on` / `warn_off`                | 是否开启编译器警告                                          |
| `qt`                                  | 启用 Qt 规则（moc / uic / rcc），**几乎必带**​               |
| `console`                             | Windows 下为 GUI 程序额外打开控制台窗口，方便 `printf` 调试 |
| `static` / `shared`                   | `lib` 模板下选择静态库 / 动态库（默认 `shared`）            |
| `plugin`                              | 按插件方式构建（自动加 `-fPIC`、导出符号）                  |
| `create_prl` / `no_prl`               | 是否生成 `.prl` 库依赖描述文件（默认开启，利于依赖传递）    |

### 1.5 `DESTDIR` 与一组"输出路径"变量

`DESTDIR` 指定**最终产物（exe / so / dll）的输出目录**。

```
DESTDIR = $$PWD/bin             # 产物统一放进工程目录下的 bin/
DESTDIR = $$OUT_PWD/../dist     # 也可放到构建目录之外
```

- 不写时，默认落在**构建目录根下**，例如 `build-MyApp-Desktop-Debug/`；

- 多子工程统一输出、或要直接打包发布时，建议显式配置。

qmake 里还有一组容易混淆的"路径变量"，职责各不相同：

| 变量          | 管理的内容                        |
| ------------- | --------------------------------- |
| `DESTDIR`     | 最终 exe / so / dll 的落点        |
| `OBJECTS_DIR` | 编译产生的 `.o` / `.obj` 中间文件 |
| `MOC_DIR`     | moc 生成的中间 `.cpp` 文件        |
| `RCC_DIR`     | rcc 生成的资源源文件              |
| `UI_DIR`      | uic 生成的 `ui_xxx.h`             |

```
DESTDIR     = $$PWD/bin
OBJECTS_DIR = $$OUT_PWD/obj
MOC_DIR     = $$OUT_PWD/moc
UI_DIR      = $$OUT_PWD/ui
RCC_DIR     = $$OUT_PWD/rcc
```

> **小技巧**：把中间文件全部归拢到 `$$OUT_PWD` 下，源码目录能保持干净，也便于 `git clean`。

### 1.6 `QMAKE_LFLAGS_WINDOWS` —— 向链接器"透传"原始参数

`QMAKE_LFLAGS_WINDOWS` 属于 qmake 的**底层链接器变量族**，仅在 Windows 平台生效，作用是把原始 flag **直接追加到链接命令行**。

```
# GUI 程序不弹出控制台窗口（ subsystem:windows ）
QMAKE_LFLAGS_WINDOWS += /SUBSYSTEM:WINDOWS

# 静态链接 C/C++ 运行时，避免分发 msvcrt 相关 DLL
QMAKE_LFLAGS_WINDOWS += /MT

# 要求管理员权限启动
QMAKE_LFLAGS_WINDOWS += /MANIFESTUAC:"level='requireAdministrator'"
```

**同类变量一览**

| 变量                   | 适用平台 / 阶段 | 用途                                 |
| ---------------------- | --------------- | ------------------------------------ |
| `QMAKE_LFLAGS`         | 全平台          | 通用链接参数                         |
| `QMAKE_LFLAGS_WINDOWS` | Windows         | Windows 专用链接参数                 |
| `QMAKE_LFLAGS_LINUX`   | Linux           | Linux 专用                           |
| `QMAKE_LFLAGS_MAC`     | macOS           | macOS 专用                           |
| `QMAKE_LFLAGS_SONAME`  | Unix-like       | 设置 `DT_SONAME`（库版本号）         |
| `QMAKE_CXXFLAGS`       | 全平台          | C++ 编译参数，如 `-Wall -Wextra -O2` |
| `QMAKE_CFLAGS`         | 全平台          | C 编译参数                           |
| `QMAKE_POST_LINK`      | 链接后          | 拷贝 DLL、strip、签名等收尾命令      |
| `QMAKE_PRE_LINK`       | 链接前          | 链接前的准备工作                     |

> **💡 设计建议**：这类变量可移植性差，属于"最后手段"。能用 `CONFIG`、`LIBS`、`QMAKE_POST_LINK` 解决的，就不要直接写平台专属 flag。进入 Qt6 / CMake 时代，这些需求通常改用工具链与链接特性来表达。



**其他高频变量速查**

-----------

```
# ---------- 工程文件清单 ----------
SOURCES += main.cpp widget.cpp          # 源文件
HEADERS += widget.h
FORMS    += mainwindow.ui               # Qt Designer 界面文件
RESOURCES += res.qrc                    # 资源文件（图片、qss、翻译等）

# ---------- 头文件与库 ----------
INCLUDEPATH += $$PWD/3rd/include        # 追加头文件搜索路径
LIBS        += -L$$PWD/3rd/lib -lmylib  # 库路径 + 库名
LIBS        += -lws2_32 -liphlpapi      # Windows 系统库

# ---------- 预处理器 ----------
DEFINES += QT_DEPRECATED_WARNINGS MY_VERSION=2

# ---------- 条件判断：.pro 的"灵魂" ----------
win32:        LIBS += -luser32
unix: !macx: LIBS += -lpthread -ldl
macx:        LIBS += -framework Cocoa

# 按 debug / release 分流输出目录
CONFIG(debug, debug|release):    DESTDIR = $$PWD/bin/debug
CONFIG(release, debug|release):  DESTDIR = $$PWD/bin/release
```

> **说明**：`$$PWD` 表示**工程文件所在目录**（源码目录），`$$OUT_PWD` 表示**构建输出目录**，二者在多目录构建与 shadow build 时千万不能混用。

3. `SUBDIRS`：多子工程的管理核心

----------------------

---

### 3.1 它到底是什么

`SUBDIRS` **不能单独出现**，必须配合 `TEMPLATE = subdirs` 使用。

> **语义**：本工程自身**不产生 exe 也不产生 lib**，只负责**按依赖关系递归进入各子目录，逐一调用子目录里的 `.pro` 完成构建**。

可以这样类比：

| 构建系统          | 等价机制                     |
| ----------------- | ---------------------------- |
| qmake + `subdirs` | Makefile 里的 `subdirs` 目标 |
| CMake             | `add_subdirectory()`         |

### 3.2 最小可用结构

```
MyProject/
├── MyProject.pro          ← 顶层：subdirs 总控
├── core/
│   └── core.pro
├── gui/
│   └── gui.pro
└── app/
    └── app.pro
```

**顶层 `MyProject.pro`**​ —— 精简到只剩两行：

```
TEMPLATE = subdirs
SUBDIRS  = core gui app
```

顶层工程**不需要**​ `QT`、`SOURCES`、`TARGET`，因为它本身不编译任何代码。

### 3.3 `SUBDIRS` 的三种写法

**写法一：裸目录名（最常用）**

```
SUBDIRS = core gui app
```

- 每一项**既是子目录名，也是逻辑工程名**；

- qmake 会依次查找 `core/core.pro`、`gui/gui.pro`、`app/app.pro`；

- 默认约定：**目录名与目录内 `.pro` 文件名一致**。

**写法二：先起逻辑名，再指向真实路径**

```
SUBDIRS = mycore mygui

mycore.subdir = libs/core              # 真实目录
mygui.subdir  = src/gui
mycore.file   = libs/core/core-lib.pro # 连 .pro 文件名也可自定义
```

适用于目录结构不规范、或想给工程起一个更整洁的逻辑名的情况。

**写法三：内联子工程（不单独建 `.pro`）**

```
SUBDIRS = tests

tests.subdir  = .
tests.files   = test_main.cpp
tests.depends = core app
```

> 可读性较差，只适合临时或极小的测试工程。**正式项目建议每个子模块一个独立 `.pro`。**

### 3.4 `.depends` —— 控制构建顺序的关键

默认情况下，qmake 会**并行构建**各子目录。但一旦存在"先有库、后链接"的关系，就必须显式声明依赖：

```
SUBDIRS = core gui app plugins tests

app.depends     = core gui      # app 依赖 core、gui，必须先编出 lib
plugins.depends = app           # 插件依赖主程序接口/头文件
tests.depends   = app
```

含义很直白：**"别急着编我，先把 XXX 编完。"**

> **⚠️ 玄学现场**：第一次 `build` 报找不到 `-lcore`，再 `build` 一次就好了 —— 九成是因为缺了 `.depends`，并行构建时 `app` 跑到了 `core` 前面。

### 3.5 subdirs 支持的"元属性"

所有属性都挂在 `逻辑名.属性` 后面：

| 属性                | 作用                                               |
| ------------------- | -------------------------------------------------- |
| `xxx.subdir`        | 子工程所在目录（默认 = 逻辑名）                    |
| `xxx.file`          | 显式指定 `.pro` 文件路径                           |
| `xxx.depends`       | 依赖哪些兄弟工程（空格分隔）                       |
| `xxx.target`        | 自定义 make 目标名                                 |
| `xxx.makefile`      | 指定生成的 Makefile 名                             |
| `CONFIG += ordered` | 强制**按列表顺序串行构建**（简单，但牺牲并行加速） |

```
TEMPLATE = subdirs
CONFIG  += ordered      # 懒人方案：列表顺序即构建顺序
SUBDIRS  = core gui app
```

> **`ordered` 还是 `depends`？**
>
> - `ordered`：全局串行，写法简单，构建慢；
>
> - `depends`：声明依赖图，能并行又精确。
>
> **生产项目推荐 `depends`。**

### 3.6 子工程之间"怎么链接"

请牢记一句原则：

> **`subdirs` 只管构建顺序，不管库怎么链。链接规则写在子工程自己的 `.pro` 里。**

**方式 A：传统 `-L` + `-l`**

```
# app/app.pro
LIBS += -L$$DESTDIR -lcore -lgui
INCLUDEPATH += $$PWD/../core/include $$PWD/../gui/include
```

前提：`core` 那边是 `TEMPLATE = lib`，且 `DESTDIR` 统一。

**方式 B：直接用 `$$PWD` / `$$OUT_PWD` 定位（小项目够用）**

```
LIBS += -L$$OUT_PWD/../../core/$$CONFIG -lcore
```

**方式 C：借助 `.prl` 实现依赖传递（推荐，大项目首选）**

```
# core/core.pro
TEMPLATE = lib
CONFIG  += shared create_prl     # create_prl 默认开启
TARGET   = core
```

`core.prl` 会记录 `core` 自身的库路径与传递依赖，`app.pro` 里只需：

```
LIBS += -lcore      # 头文件路径与间接依赖由 .prl 自动补齐
```

> 这是 qmake 里**最接近现代包管理**的做法，能显著减少 `LIBS` / `INCLUDEPATH` 的手工维护量。

### 3.7 完整可抄模板

**顶层 `MyProject.pro`**

```
TEMPLATE = subdirs
CONFIG  += c++17

SUBDIRS  = core gui app plugins tests

# ---- 构建依赖图 ----
app.depends     = core gui
plugins.depends = app
tests.depends   = app

# ---- 统一产物与中间文件输出 ----
DESTDIR     = $$PWD/build/out
OBJECTS_DIR = $$OUT_PWD/obj
MOC_DIR     = $$OUT_PWD/moc
UI_DIR      = $$OUT_PWD/ui
RCC_DIR     = $$OUT_PWD/rcc
```

**子工程 `core/core.pro`**

```
TARGET   = core
TEMPLATE = lib
CONFIG  += c++17 shared create_prl
QT       += core

DEFINES += CORE_LIBRARY          # 配合 Q_DECL_EXPORT / Q_DECL_IMPORT
HEADERS += core_global.h coreengine.h
SOURCES += coreengine.cpp
```

**子工程 `app/app.pro`**

```
TARGET   = MyApp
TEMPLATE = app
CONFIG  += c++17 qt warn_on
QT       += core gui widgets

LIBS += -L$$DESTDIR -lcore -lgui
INCLUDEPATH += $$PWD/../core $$PWD/../gui

SOURCES += main.cpp mainwindow.cpp
HEADERS += mainwindow.h
FORMS    += mainwindow.ui
RESOURCES += res.qrc

# Windows GUI 程序去掉控制台窗口
win32: QMAKE_LFLAGS_WINDOWS += /SUBSYSTEM:WINDOWS
```

### 3.8 常见故障速查表

| 现象                                                 | 根因                                                        | 对策                                                               |
| ---------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------ |
| `WARNING: Unable to find file for subdir xxx`        | 逻辑名与目录名不一致，或目录下没有同名 `.pro`               | 统一命名，或用 `xxx.file` 显式指定                                 |
| 第一次 build 报 `cannot find -lcore`，重编一次就好了 | 缺 `.depends`，并行构建顺序错乱                             | 补上 `app.depends = core ...`                                      |
| 子工程改了代码，顶层 make 没重编                     | subdirs 只有目录级依赖，无文件级追踪                        | Qt Creator 中"重新构建"，或 `make -C core`                         |
| 链接报大量未定义符号，库文件明明存在                 | `DESTDIR` 不一致 / 漏写 `-L` / 库名大小写（Linux 严格区分） | 核对路径、库名、`ldd` / `dumpbin`                                  |
| 只想构建某一个子工程                                 | 全量构建太慢                                                | `make -C app`，或在构建步骤指定目标，也可临时注释其他 `SUBDIRS` 项 |

4. "必须配置"清单：按项目规模递进

-------------------

---

### 4.1 场景一：最小可用（只有一个 `main.cpp`）

```
QT += core
CONFIG += c++17 console
SOURCES += main.cpp
```

> `TARGET`、`TEMPLATE` 都可以不写，默认就是 `app` + 目录名。

### 4.2 场景二：标准 GUI 程序（最常见）

```
QT       += core gui widgets
TARGET    = MyApp
TEMPLATE  = app
CONFIG   += c++17 qt warn_on

SOURCES += main.cpp mainwindow.cpp
HEADERS += mainwindow.h
FORMS    += mainwindow.ui
RESOURCES += res.qrc
```

### 4.3 场景三：库 / 多子工程 / 需要发布

在场景二基础上追加：

```
TEMPLATE = lib          # 做库；做总控工程则写 subdirs

DESTDIR     = $$PWD/bin
OBJECTS_DIR = $$OUT_PWD/obj
MOC_DIR     = $$OUT_PWD/moc
UI_DIR      = $$OUT_PWD/ui
VERSION     = 1.0.0

win32: QMAKE_LFLAGS_WINDOWS += /SUBSYSTEM:WINDOWS
```

5. 本章小结

-------

---

### 5.1 核心变量速记表

| 变量                      | 一句话记忆                             |
| ------------------------- | -------------------------------------- |
| `QT`                      | **要用哪些 Qt 模块**​                   |
| `TARGET`                  | **产物叫什么**​                         |
| `TEMPLATE`                | **做程序、做库，还是做总控**​           |
| `CONFIG`                  | **编译/链接的全局开关**​                |
| `DESTDIR`                 | **成品丢到哪里**​                       |
| `QMAKE_LFLAGS_*`          | **透传给链接器的平台专属参数（慎用）**​ |
| `SUBDIRS` + `xxx.depends` | **总控工程：谁来编、按什么顺序编**​     |

### 5.2 配置原则

1. **真正"必配"的只有两项**：写界面时 `QT += widgets`，以及 `SOURCES` 文件清单；

2. 其余变量（`TARGET`、`DESTDIR`、各 `*_DIR`）都是为了**工程可控、可复现、可发布**；

3. 能不用 `QMAKE_LFLAGS_*` 这类底层变量，就尽量不用——可移植性更好；

4. 若项目从 Qt5 向 Qt6 演进，官方推荐迁移到 **CMake**，对应关系为：

| qmake                         | CMake                                         |
| ----------------------------- | --------------------------------------------- |
| `QT += widgets`               | `find_package(Qt6 COMPONENTS Widgets)`        |
| `TEMPLATE = app` + `SOURCES`  | `qt_add_executable(app ...)`                  |
| `TEMPLATE = lib`              | `qt_add_library(core ...)`                    |
| `SUBDIRS = core gui app`      | `add_subdirectory(core)` …                    |
| `LIBS += -lcore` + `.depends` | `target_link_libraries(app core)`（自动传递） |

> 迁移到 CMake 后，头文件路径、库依赖、构建顺序都由 target 体系自动推导，不再需要手写 `-L`、`-l` 与 `.prl`。可以作为延伸练习：把 3.7 的工程改写成 `CMakeLists.txt`。


