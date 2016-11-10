/**
 * 级联选择组件
 * @version 1.0.0
 * @param {[type]} selector [description]
 * @param {[type]} params   [description]
 */
(function($) {

  var CascadeSelector = function ($selector, params) {
    'use strict';

    var _this = this;
    var _cacheData = [];
    var renderCache = [];
    var $wrappers;

    /*=========================
      Default Parameters
      ===========================*/
    var defaults = {
      data: [], // 列表项数组，每个数组元素代表了一个列表项的数据集
      domTag: ['ul', 'li'],
      dataKeys: ['id', 'name'],
      responseField: 'data',  // 异步请求数据源返回数据字段
      defaultActiveData: [], // 默认选中激活项 [...id]，依次对应每个层级
      wrapperClass: 'cascade-list-wrapper',
      wrapperActiveClass: 'cascade-list-wrapper-active',
      listClass: 'cascade-list',
      listActiveClass: 'cascade-list-active',
      itemClass: 'cascade-list-item',
      itemActiveClass: 'cascade-list-item-active',
      onChange: undefined,
      afterRender: undefined,
      referenceKey: '', // 默认取 dataKeys 的第一项
      queryKey: '',     // 接口查询字段
      isRendered: false
    };

    params = params || {};

    _this.params = $.extend({}, defaults, params);

    if (!_this.params.referenceKey) {
      _this.params.referenceKey = _this.params.dataKeys[0];
    }

    if (!_this.params.queryKey) {
      _this.params.queryKey = _this.params.dataKeys[0];
    }

    init();
    bindEvents();


    /*==========================================
        Event Listeners
    ============================================*/
    function init() {
      $wrappers = $selector.find('.' + _this.params.wrapperClass);
      $wrappers.each(function(i, el) {
        var $wrapper = $(el);
        // 创建一个列表 ul
        var $listElement = $(document.createElement(_this.params.domTag[0]));
        // 添加对应的 class 类
        $listElement.addClass(_this.params.listClass);
        $wrapper.append($listElement);
      });

      // 渲染列表项
      renderCascadeList(0, 0, rendListCallback);
    }

    function bindEvents() {
      $selector.on('click', '.' + _this.params.itemClass, function(e) {
        e.stopPropagation();
        e.preventDefault();

        var $this = $(this);
        var $wrapper = $this.closest('.' + _this.params.wrapperClass);
        var currentKey = $wrapper.attr('data-id');
        var index = $wrappers.index($wrapper);
        var selectedId = $this.attr('data-id');

        if (selectedId != currentKey) {
          var tmp = {};
          tmp[_this.params.dataKeys[0]] = selectedId
          tmp[_this.params.dataKeys[1]] = $this.text();
          $wrapper.attr('data-id', selectedId);
          // 记录所选中项
          renderCache[index] = tmp;
          _this.params.onChange && _this.params.onChange($wrapper, tmp);
          renderCascadeList(index + 1, selectedId, rendListCallback);
        }
      });

      $selector.find('.' + _this.params.wrapperClass).on('click', function() {
        $(this).toggleClass(_this.params.wrapperActiveClass)
          .siblings().removeClass(_this.params.wrapperActiveClass);
      });
    }

    function rendListCallback($container, obj, index) {
      // 设置默认数据源
      $container.addClass('isLoaded');
      if ($wrappers.filter('.isLoaded').length <= $wrappers.length) {
        $container.find('.' + _this.params.itemClass).each(function(i, el) {
          if ($(el).text().indexOf(_this.params.defaultActiveData[index]) > -1) {
            obj.id = $(el).attr('data-id');
            obj.name = $(el).text();
            $container.attr('data-id', obj.id);
          }
        });
      }

      _this.params.onChange && _this.params.onChange($container, obj);
    }

    /**
     * 渲染对应列表，递归调用，直到所有的列表渲染完毕
     * @param  {[type]} index      列表索引，默认为 0
     * @param  {[string|number]} prevKey 上一级关联id， 0
     * @return {[type]}            [description]
     */
    function renderCascadeList(index, prevKey, callback) {
      // 默认从第一项开始渲染
      index = index || 0;
      prevKey = prevKey || 0;
      var $container = $wrappers.eq(index);
      var count = Math.min($wrappers.length, _this.params.data.length);

      if (index < count) {
        // 1、获取渲染数据
        generateRenderData(index, prevKey).then(function(data) {
          // 2、渲染列表
          $container.find('.' + _this.params.listClass)
            .html(createChildElementStr(data, _this.params.domTag[1]));

          // 3、获取选中数据，触发回调，显示选中项
          var obj = {};
          $.each(_this.params.dataKeys, function(i, key) {
            obj[key] = data[Object.keys(data)[0]][key];
          });
          renderCache[index] = obj;
          // 触发回调
          if (typeof callback === 'function') callback($container, obj, index);

          // 递归
          renderCascadeList(index + 1, obj[_this.params.referenceKey], callback);
        });
      } else {
        // 初始化渲染结束，触发回调
        _this.params.afterRender && _this.params.afterRender(renderCache);
      }
    }

    function generateRenderData(index, prevKey) {
      var $deferred = $.Deferred();

      // 首先判断是否有缓存数据
      if (_cacheData[index] && _cacheData[index][prevKey]) {
        $deferred.resolve(_cacheData[index][prevKey]);
      }

      // 没有缓存数据，缓存到本地
      if (typeof _this.params.data[index] === 'object') {
        cacheDataHandler(index, prevKey, _this.params.data[index][prevKey]);
        $deferred.resolve(_this.params.data[index][prevKey]);
      } else if (typeof _this.params.data[index] === 'string') {
        // 异步获取数据
        var queryObj = {};
        var cache;
        queryObj[_this.params.queryKey] = prevKey;
        $.getJSON(_this.params.data[index], queryObj, function(resp) {
          if (_this.params.formateDataFn) {
            cache = _this.params.formateDataFn(resp[_this.params.responseField]);
          }
          cacheDataHandler(index, prevKey, cache);
          $deferred.resolve(cache);
        });
      }

      return $deferred.promise();
    }

    function cacheDataHandler(index, prevKey, data) {
      // 如果为 string, 重新初始化为对象，覆盖默认传递的 string 接口
      if (!_cacheData[index] || typeof _cacheData[index] === 'string') _cacheData[index] = {};
      _cacheData[index][prevKey] = data;
    }

    function createChildElementStr(data, tag) {
      var elStr = '';
      $.each(data, function(index, val) {
        elStr += '<' + tag + ' class="' + _this.params.itemClass + '" data-id="' + val[_this.params.dataKeys[0]] + '">' + val[_this.params.dataKeys[1]] + '</' + tag + '>';
      });
      return elStr;
    }
  }

  $.fn.cascadeSelector = function(params) {
    var firstInstance;
    this.each(function(i) {
      var that = $(this);
      var s = new CascadeSelector(that, params);
      if (!i) firstInstance = s;
    });
    return firstInstance;
  };

})(jQuery);
