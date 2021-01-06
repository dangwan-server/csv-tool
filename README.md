## 支持

1. 批量转换excel文件为csv文件
2. 批量/单生成go实体文件
3. 批量/单生成lua脚本
4. 配置忽略字段

## 使用方法

`windows`

- 进入钉钉->企业盘->卡牌-go-分享

- 下载dist.tar到本地

- 解压dist.tar 

- 找到cli-win.exe文件

- 运行cmd执行cli-win.exe

```shell
cli-win.exe {command} [options i,o,ignore] 
```

- 注意事项:以转换excel文件命令为例

1. 保证输入的目录真实存在，保证输出目录真实存在

2. 此命令将扫描in_excel_path目录，将所有.excel后缀文件转换成对应的csv文件，存储到out_csv_path

```shell
cd dist
cli-win.exe conv i=C:\Users\DeskTop\excel o=C:\Users\DistTop\csv
```

## 配置文件

### 针对目录批量执行的时候，忽略某些字段

`ignore.json`

```
[
 "item":["name"],
 "hero":["type"],
 "Othrer":["anyway"]
]
```

```
cli.exe ... ignore=ignore.json
```

## Example 

### 转换excel->csv

- 批量转换excel文件 

```shell 
cli-win.exe conv i=C:\Users\DeskTop\excel o=C:\Users\DistTop\csv
```

### 生成go实体

```shell
cli-win.exe ggo i={csv文件} o={生成go文件} package={go包名称}
```

- 批量生成go实体文件 

```shell 
## 批量命令要忽略字段的时候请指定ignore的配置文件
cli-win.exe ggo i=C:\Users\DistTop\csv o=C:\Users\DistTop\go ignore=ignore.json
```

- 生成单个go实体文件

```shell
cli-win.exe ggo i=C:\Users\DistTop\csv\item.csv o=C:\Users\DistTop\go\item_costom.go ignore=name,type
## or 自定义输出的go名字 
cli-win.exe ggo i=C:\Users\DistTop\csv\item.csv o=C:\Users\DistTop\go ignore=name,type
```

### 生成lua脚本

```shell
cli-win.exe glua i={csv文件} o={生成lua脚本} cache_key={缓存前缀}
```

- 扫描csv录生成lua脚本

```shell 
cli-win.exe glua i=C:\Users\DistTop\csv o=C:\Users\DistTop\lua ignore=name
```

- 指定单个csv文件生成lua脚本 

```shell
cli-win.exe glua i=C:\Users\DistTop\csv\item.csv o=C:\Users\DistTop\lua ignore=name
```





