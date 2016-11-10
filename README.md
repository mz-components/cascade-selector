## 级联选择插件
一个基于 jquery 的级联选择插件，支持同时本地和异步远程获取级联数据；支持自定义获取远程数据时的查询字段名称；支持自定义格式化数据源；提供每个列表项选择回调事件，提供列表项渲染完成回调事件；支持自定义渲染所需数据属性，比如 id, name, 等等。



## 目录
- [使用方法](#user-content-使用方法)
- [文档](#user-content-文档)
- [优化](#user-content-优化)
- [Q&A](#user-content-qa)

## 使用方法
``` html
<!-- 模板结构 -->
<div class="drop-down-selector address-down-selector">
  <div class="down-selector-wrapper province-selector-wrapper">
    <div class="selector-title"><span>请选择省</span><i class="icon-down-arrow"></i></div>
  </div>
  <div class="down-selector-wrapper city-selector-wrapper">
    <div class="selector-title"><span>请选择市</span><i class="icon-down-arrow"></i></div>
  </div>
  <div class="down-selector-wrapper county-selector-wrapper">
    <div class="selector-title"><span>请选择区</span><i class="icon-down-arrow"></i></div>
  </div>
  <div class="down-selector-wrapper town-selector-wrapper">
    <div class="selector-title"><span>街道</span><i class="icon-down-arrow"></i></div>
  </div>
</div>
```
``` javascript
// 调用方式
$('.address-down-selector').cascadeSelector({
  data: AREA_DATA,
  domTag: ['ul', 'li'],
  dataKeys: ['id', 'name'],
  queryKey: 'pid',
  responseField: 'data',  // 异步请求数据源返回数据字段
  defaultActiveData: ['广东省', '深圳市'], // 默认选中激活项 [...id]，依次对应每个层级
  wrapperClass: 'down-selector-wrapper',
  wrapperActiveClass: 'down-selector-wrapper-active',
  listClass: 'down-selector',
  itemClass: 'selector-item',
  formateDataFn: formateDataFn,
  onChange: function($container, data) {
    // 这里可以自定义渲染选中文案
    var $title = $container.find('.selector-title');
    $title.find('span').text(data.name);
  },
  afterRender: function(data) {
    // TODO 这里可以获取到所有列表项选中的数据
  }
});

// 自定义格式化函数，将 array 类型转化为 Object 类型
// [{id: 1,name:'asd'}, {id: 2, name: 'asdfasfd'}] => { 1: {id:1, name: 'asd'}, 2: {id: 2, name: 'asdfasfd'}};
function formateDataFn(data) {
  var newData = {};
  $.each(data, function(key, val) {
    newData[val.id] = val;
  });
  return newData;
}
```
![usage](./images/usage.png)

## 文档

### data
``` javascript
data: [{},...{}];
```
data 为数组类型数据，data[i] 为 Object 或者 string 类型，如果 data[i] 为 Array 类型，请先自己格式化为如下的 Object 类型。data[i] 数据结构如下：
``` javascript
var data = [];
data[0] 会相对特殊一点，0 是所有一级数据对象的父级 id;
data[0] = {
  0: {
    11: {
      id: 11,
      name: '广东省',
    },
    12: {
      id: 12,
      name: '江西省'
    }
    ....
  }
}

// 保证 data[i] (i > 0) 后面的数据项的父级节点 id 为上一级存在的 id,
// 这么设计数据结构的原因是为了更好的做数据缓存
data[i] = {
  11: {
    45: {
      id: 45,
      name: '深圳市'
    },
    46: {
      id: 46,
      name: '广州市'
    }
    ...
  }
  12: {
    78: {
      id: 78,
      name: '赣州'
    },
    79: {
      id: 79,
      name: '南昌'
    }
    ...
  }
}

// data[i] 为 string 类型，如果跨域，请在接口后面带上 callback=? 参数
// 内容使用的是 getJSON() 方式获取数据，可支持跨域，当然首先你的接口要支持。
data[i] = 'example.com/api/v1/getAddressData?callback=?';
```

### domTag: Array[2]
domTag 为要渲染的 dom 节点类型配置，为 Array 类型， domTag = ['ul', 'li'];
长度为2，domTag[0] 表示父级容器，domTag[1] 表示子集列表元素



### dataKeys: Array[2]
dataKeys: Array；可自定义配置数量，字段名称为数据源中存在的字段，比如
dataKeys: ['id','name']; 级联关键 id 也是取 dataKeys[0] 项，所以默认第一项为关键 id 属性。



### responseField: string
用来给异步接口返回获取数据内容的字段名称；暂不支持多层级数据，比如 'data.address';
``` javascript
// 假如接口返回数据为：
response = {
  data: [...],
  status: 200
}
```
那么这个时候，responseField = 'data'



### defaultActiveData: Array[n]
默认选中项文案配置。用来指定组件初始之后，默认选中哪个项，如果没有指定，则组件默认取列表的第一项。
defaultActiveData: ['广东省','深圳市'];



### wrapperClass: string
每个列表项的外层容器，在 wrapper 下面包含了选中项 title 的 dom 结构，title 的 DOM 结构可按照需求自定义，在数据处理的时候，只要在回调函数中相应的调整就好了。



### wrapperActiveClass: string

上面 wrapperClass 的激活态 class。



### listClass: string
列表项类名。



### listActiveClass: string

激活类名，组件默认的是 hover 的时候激活态 class。



### queryKey: string
异步获取接口的查询字段名，目前只支持一个查询字段，暂不提供多个。




### formateDataFn: function
自定义格式化数据函数，用来处理当从接口异步获取数据返回类型和列表所需数据结构类型不一致时格式化数据。




### onChange: function(container, data){}
每个列表项选中之后渲染之后的回调函数，函数返回当前列表项选中的 id, name 属性。



### afterRender: function(data){}

afterRender: function; 当用户选择某个列表项之后，列表项级联渲染完成之后触发的回调方法。在这里可以获取到整个组件所有选中级联项的数据；
data = [{id: xxx, name: 'xxxx'}, ...{id: xxx, name: 'xxxx'}];



## 优化
目前我们的组件还不是很完善，还有很多优化的地方：
- 去除 domTag 耦合，改用 template = '<ul>xxxx</ul>' 的方式
- 去除 ajax 获取数据的耦合
- 动态添加级联项需求




## Q&A
有任何问题欢迎提 issue 交流 :)。
