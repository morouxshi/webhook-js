/*! webhook - v - 2014-05-15
* https://github.com//webhook
* Copyright (c) 2014 ; Licensed MIT */
(function ($) {

  "use strict";

  var Affix = function (element, options) {
    this.init(element, options);
  };

  Affix.prototype = {
    init: function (element, options) {
      this.$element = $(element);
      this.options  = this.getOptions(options);
      this.$window  = $(window);

      if (!this.options.offset.top) {
        this.options.offset.top = this.$element.offset().top - 10;
      }

      window.console.log(this.options);

      this.$window.on({
        'scroll.affix': $.proxy(this.checkPosition, this),
        'click.affix': $.proxy(function () {
          setTimeout($.proxy(this.checkPosition, this), 1);
        }, this)
      });

      this.initialwidth = this.$element.width() === this.$element.parent().width() ? 'auto' : this.$element.width();

      this.checkPosition();
    },

    getOptions: function (options) {
      return $.extend({}, $.fn.affix.defaults, this.$element.data(), options);
    },

    checkPosition: function () {

      if (!this.$element.is(':visible')) {
        return;
      }

      var scrollHeight = $(document).height(),
          scrollTop    = this.$window.scrollTop(),
          position     = this.$element.offset(),
          offset       = this.options.offset,
          offsetBottom = offset.bottom,
          offsetTop    = offset.top,
          reset        = 'wy-affix wy-affix-top wy-affix-bottom',
          affix;

      if (typeof offset !== 'object') {
        offsetBottom = offsetTop = offset;
      }

      if (typeof offsetTop === 'function') {
        offsetTop = offset.top();
      }

      if (typeof offsetBottom === 'function') {
        offsetBottom = offset.bottom();
      }

      if (this.$element.height() >= this.$window.height()) {
        affix = 'top';
      } else if (this.options.minWidth >= this.$window.width()) {
        affix = 'top';
      } else if (this.unpin !== null && (scrollTop + this.unpin <= position.top)) {
        affix = false;
      } else if (offsetBottom !== null && (position.top + this.$element.height() >= scrollHeight - offsetBottom)) {
        affix = 'bottom';
      } else if (offsetTop !== null && scrollTop <= offsetTop) {
        affix = 'top';
      } else {
        affix = false;
      }

      window.console.log(affix, scrollTop, offsetTop);

      if (this.affixed === affix) {
        return;
      }

      this.$element.width(affix ? this.initialWidth : this.$element.width());

      this.affixed = affix;
      this.unpin = affix === 'bottom' ? position.top - scrollTop : null;

      this.$element.removeClass(reset).addClass('wy-affix' + (affix ? '-' + affix : ''));

      this.$element.trigger('affix', affix);
    }

  };


 /* AFFIX PLUGIN DEFINITION
  * ======================= */

  $.fn.affix = function (option) {
    return this.each(function () {
      var $this   = $(this),
          data    = $this.data('affix'),
          options = typeof option === 'object' && option;

      if (!data) {
        $this.data('affix', (data = new Affix(this, options)));
      }

      if (typeof option === 'string') {
        data[option]();
      }
    });
  };

  $.fn.affix.Constructor = Affix;

  $.fn.affix.defaults = {
    offset: {},
    minWidth: 480,
    minHeight: function () {

    }
  };


 /* AFFIX DATA-API
  * ============== */

  $(window).on('load', function () {
    $('[data-spy="affix"]').each(function () {
      var $spy = $(this),
          data = $spy.data();

      data.offset = data.offset || {};

      if (data.offsetBottom) {
        data.offset.bottom = data.offsetBottom;
      }

      if (data.offsetTop) {
        data.offset.top = data.offsetTop;
      }

      $spy.affix(data);
    });
  });

}(window.jQuery));

(function ($) {

  "use strict";

  var keyCode = {
    BACKSPACE: 8,
    COMMA    : 188,
    DELETE   : 46,
    DOWN     : 40,
    END      : 35,
    ENTER    : 13,
    ESCAPE   : 27,
    HOME     : 36,
    LEFT     : 37,
    PAGE_DOWN: 34,
    PAGE_UP  : 33,
    PERIOD   : 190,
    RIGHT    : 39,
    SPACE    : 32,
    TAB      : 9,
    UP       : 38,
    SHIFT    : 16,
    CTRL     : 17,
    ALT      : 18
  };

  var Autocomplete = function (element, options) {
    this.init(element, options);
  };

  Autocomplete.prototype = {
    init: function (element, options) {
      this.$element = $(element).prop('readonly', true);

      this.$tagGroup = $('<div class="wy-tag-input-group">').insertAfter(this.$element);
      this.$autocompleteGroup = $('<div class="wy-autocomplete-group">').appendTo(this.$tagGroup);

      this.$input    = $('<input type="text" autocomplete="off">').appendTo(this.$autocompleteGroup);
      this.$results  = $('<div class="wy-autocomplete-dropdown">').append('<ul>');
      this.options   = this.getOptions(options);
      this.selected  = [];
      this.$selected = $([]);
      this.keyedData = {};

      this.$input.attr('placeholder', this.options.placeholder || this.$element.attr('placeholder'));

      this.listen();

      this.getSource(this.options.source);

    },

    getOptions: function (options) {
      return $.extend({}, $.fn.autocomplete.defaults, this.$element.data(), options);
    },

    getSource: function (source) {
      if (typeof source === 'object') {
        this.setData(this.options.formatSource(source));
      } else if (typeof source === 'string') {
        $.getJSON(source).done($.proxy(function (data) {
          this.setData(this.options.formatSource(data));
        }, this));
      }
    },

    setData: function (data) {
      this.data = data;
      this.formattedData = this.options.formatData(data);

      $.each(this.data, $.proxy(function (index, item) {
        this.keyedData[this.options.formatSelect(item)] = item;
      }, this));

      // initial data
      if (this.$element.val()) {
        $.each(this.$element.val().split(','), $.proxy(function (index, value) {
          this.selectItem(this.keyedData[value]);
        }, this));
      }
    },

    listen: function () {

      this.$input.on({
        'keydown.autocomplete': $.proxy(this.keydown, this),
        'keyup.autocomplete': $.proxy(this.keyup, this)
      });

      this.$results.on('mouseenter.autocomplete', 'li', function () {
        $(this).addClass('on').siblings().removeClass('on');
      });

      this.$results.on('click.autocomplete', 'li', $.proxy(this.selectCurrent, this));

      this.$element.on({
        'selectItem.autocomplete': $.proxy(function (event, item) {

          var $selected = $('<span class="wy-tag">')
                            .text(this.options.formatDisplay(item))
                            .data('item', item)
                            .attr('data-val', this.options.formatSelect(item))
                            .insertBefore(this.$autocompleteGroup);

          $('<a class="wy-tag-remove">').appendTo($selected).on('click', $.proxy(function () {
            this.removeItem(item);
          }, this));

          this.$selected = this.$selected.add($selected);
        }, this),
        'removeItem.autocomplete': $.proxy(function (event, item) {
          this.$selected.filter('[data-val="' + this.options.formatSelect(item) + '"]').remove();
        }, this)
      });

    },

    keydown: function (event) {

      switch (event.keyCode) {
        case keyCode.UP:
          event.preventDefault();
          this.prev();
          break;

        case keyCode.DOWN:
          event.preventDefault();
          this.next();
          break;

        case keyCode.TAB:
        case keyCode.ENTER:
        case keyCode.ESCAPE:
          event.preventDefault();
          break;

      }
    },

    keyup: function (event) {

      switch (event.keyCode) {
        case keyCode.UP:
        case keyCode.DOWN:
        case keyCode.CTRL:
        case keyCode.SHIFT:
        case keyCode.ALT:
          break;

        case keyCode.ENTER:
          this.selectCurrent();
          break;

        case keyCode.ESCAPE:
          this.hide();
          break;

        default:
          this.search(this.$input.val());
          break;
      }

      event.stopPropagation();
      event.preventDefault();
    },

    search: function (query) {

      this.query = query || this.$input.val();

      if (this.query.length < this.options.minLength) {
        return this.hide();
      }

      return this.process(this.formattedData.slice());
    },

    process: function (items) {
      items = this.match(items);
      items = this.sort(items);
      return this.render(items.slice(0, this.options.perPage)).show();
    },

    match: function (items) {

      var query = this.query.toLowerCase(),
          matched = this.matched = [];

      return $.grep(items, function (item, index) {
        return ~item.toLowerCase().indexOf(query) && matched.push(index);
      });
    },

    sort: function (items) {

      var beginswith = [],
          caseSensitive = [],
          caseInsensitive = [],
          item, mappedItem, count = 0;

      while (item = items.shift()) {
        mappedItem = this.matched[count++];
        if (!item.toLowerCase().indexOf(this.query.toLowerCase())) {
          beginswith.push(mappedItem);
        } else if (~item.indexOf(this.query)) {
          caseSensitive.push(mappedItem);
        } else {
          caseInsensitive.push(mappedItem);
        }
      }

      return beginswith.concat(caseSensitive, caseInsensitive);
    },

    next: function () {
      var on = this.$results.find('.on').removeClass('on'),
          next = on.next();

      if (!next.length) {
        next = this.$results.find('li').first();
      }

      next.addClass('on');
    },

    prev: function () {
      var on = this.$results.find('.on').removeClass('on'),
          prev = on.prev();

      if (!prev.length) {
        prev = this.$results.find('li').last();
      }

      prev.addClass('on');
    },

    selectCurrent: function () {
      return this.selectItem(this.$results.find('.on').data('item'));
    },

    selectItem: function (item) {

      var val = this.options.formatSelect(item);

      if (~this.selected.indexOf(val)) {
        return this;
      }

      if (this.options.limit && this.selected.length >= this.options.limit) {
        return this;
      } else if (this.options.limit === 1) {
        this.selected = [val];
      } else {
        this.selected.push(val);
      }

      this.updateSelection();

      this.$element.trigger('selectItem.autocomplete', item);
      this.hide();
      this.$input.val('');

      return this;
    },

    updateSelection: function () {
      this.$element.val(this.selected.join(this.options.separator)).trigger('change');
    },

    removeItem: function (item) {
      this.selected.splice(this.selected.indexOf(this.options.formatSelect(item)), 1);
      this.updateSelection();
      this.$element.trigger('removeItem.autocomplete', item);
      return this;
    },

    render: function (orderedKeys) {

      this.$results.find('ul').empty();

      $.each(orderedKeys, $.proxy(function (index, key) {
        $('<li>').text(this.options.formatDisplay(this.data[key])).data('item', this.data[key]).appendTo(this.$results.find('ul'));
      }, this));

      this.$results.find('li').first().addClass('on');

      return this;
    },

    show: function () {

      if (!this.$results.is(':empty')) {
        this.$results.appendTo(this.$autocompleteGroup);
      }

      return this;
    },

    hide: function () {
      this.$results.detach();

      return this;
    }

  };


 /* AUTOCOMPLETE PLUGIN DEFINITION
  * ============================== */

  $.fn.autocomplete = function (option) {
    return this.each(function () {
      var $this   = $(this),
          data    = $this.data('autocomplete'),
          options = typeof option === 'object' && option;

      if (!data) {
        $this.data('autocomplete', (data = new Autocomplete(this, options)));
      }

      if (typeof option === 'string') {
        data[option]();
      }
    });
  };

  $.fn.autocomplete.Constructor = Autocomplete;

  $.fn.autocomplete.defaults = {
    separator: ',',
    limit: 1,
    perPage: 10,
    minLength: 2,
    formatSource: function (data) {
      return data;
    },
    formatData: function (data) {
      return data;
    },
    formatDisplay: function (result) {
      return result;
    },
    formatSelect: function (item) {
      return item;
    }
  };


 /* AUTOCOMPLETE DATA API
  * ===================== */

  $(window).on('load', function () {
    $('[data-provide=autocomplete]').each(function () {
      var $element = $(this),
          data     = $element.data();

      $element.autocomplete(data);
    });
  });

}(window.jQuery));

/*
<div class="wy-control-group">
<label for="right-label" >Author(s)</label>
<div class="wy-tag-input-group">
  <span class="wy-tag">Dave Snider<a href="" class="wy-tag-remove"></a></span>
  <span class="wy-tag">Andy McCurdy<a href="" class="wy-tag-remove"></a></span>
  <span class="wy-tag">Mike Horn<a href="" class="wy-tag-remove"></a></span>
  <div class="wy-autocomplete-group">
    <input type="text" id="right-label" placeholder="Search users">
    <div class="wy-autocomplete-dropdown">
      <ul>
        <li class="on">
          <img src="https://secure.gravatar.com/avatar/701bba3438bca23aed0079226247c308?s=140&d=https://a248.e.akamai.net/assets.github.com%2Fimages%2Fgravatars%2Fgravatar-user-420.png" />
          Dave snider
        </li>
        <li>
          <img src="http://static.giantbomb.com/uploads/square_tiny/0/29/955845-177637_410709_soundwave_copy.jpg" />
          Andy McCurdy
        </li>
        <li>
          <img src="http://static.giantbomb.com/uploads/square_tiny/0/5761/1630113-1446558_tronpreorder.png" />
          Mike Horn
        </li>
      </ul>
    </div>
  </div>
</div>
*/

(function ($) {

  "use strict";

  var Datetime = function (element, options) {
    this.init(element, options);
  };

  Datetime.prototype = {
    init: function (element, options) {

      this.isPolyfill = element.type !== 'datetime-local';

      this.$element = $(element);

      this.options  = this.getOptions(options);

      $('<button type="button" class="btn btn-link">Now</button>').insertAfter(this.$element).on('click', $.proxy(this.setNow, this));

      // automatic polyfill
      if ($.fn.datetime.defaults.polyfill && !this.isPolyfill) {
        return;
      }

      this.$element.attr('placeholder', this.options.format);

      this.setDatetime(this.$element.val());
      this.updateInput();

      this.$element.on({
        'focus.datetime': $.proxy(this.show, this),
        'keyup.datetime': $.proxy(this.tryDatetime, this),
        'change.datetime': $.proxy(this.tryDatetime, this),
        'click.datetime': function (event) {
          event.stopPropagation();
        }
      });

      $(document).on('click.datetime', $.proxy(this.hide, this));
    },

    getOptions: function (options) {
      return $.extend({}, $.fn.datetime.defaults, this.$element.data(), options);
    },

    tryDatetime: function () {
      var datetime = moment(this.$element.val());
      if (datetime && datetime.isValid()) {
        this.show();
      }
    },

    setNow: function () {
      this.setDatetime(moment());
    },

    setDatetime: function (datetime) {
      this.datetime = moment(datetime);
      this.updateInput();
    },

    getDatetime: function () {
      return this.datetime;
    },

    getFormattedDatetime: function () {
      // use datetime-local format if not polyfill
      var format = this.isPolyfill ? this.options.format : 'YYYY-MM-DDTHH:mm';
      return this.datetime && this.datetime.format(format);
    },

    updateInput: function () {
      this.$element.val(this.getFormattedDatetime());
      this.$element.trigger('change');
    },

    calendar: function () {

      if (this.datetimeDate === this.datetime) {
        return this.$calendar;
      } else if (this.datetimeDate) {
        this.$calendar.remove();
      }

      this.datetimeDate = this.datetime || moment();

      var template,
          verbose_day,
          daysInMonth = this.datetimeDate.daysInMonth(),
          leadDays = moment(this.datetimeDate).date(1).day(),
          numWeeks = Math.ceil((leadDays + daysInMonth) / 7),
          targetDate = this.datetimeDate.date(),
          thisMoment = moment(),
          today = thisMoment.month() === this.datetimeDate.month() && thisMoment.year() === this.datetimeDate.year() && moment().date(),
          dow, wom, datetimePosition = 1, printDate = '';

      template = "<header>";
      template += "<span>" + this.datetimeDate.format('MMMM YYYY') + "</span>";
      template += "<nav><button data-prev>&lt;</button><button data-today>&middot;</button><button data-next>&gt;</button></nav>";
      template += "</header>";

      template += '<table><thead><tr>';
      for (dow = 0; dow < 7; dow++) {
        verbose_day = moment(this.datetimeDate).day(dow).format('ddd');
        template += '<th>' + verbose_day + '</th>';
      }
      template += '</tr></thead>';

      template += '<tbody>';
      for (wom = 0; wom < numWeeks; wom++) {
        template += '<tr>';
        for (dow = 0; dow < 7; dow++) {

          if (datetimePosition > leadDays && datetimePosition <= daysInMonth + leadDays) {
            printDate = datetimePosition - leadDays;
          } else {
            printDate = '';
          }

          if (printDate === today) {
            template += '<td class="today">';
          } else {
            template += '<td>';
          }

          if (printDate === targetDate) {
            template += '<strong>' + printDate + '</strong>';
          } else {
            template += printDate;
          }

          template += '</td>';

          datetimePosition++;

        }
        template += '</tr>';
      }
      template += '</tbody></table>';

      this.$calendar = $("<div class='wy-datetime'>" + template + "</div>");

      this.$calendar.on('click.datetime.day', 'td:not(:empty)', $.proxy(function (event) {
        var datetime = moment(this.datetimeDate).date(parseInt($(event.target).text(), 10));
        if (datetime && datetime.isValid()) {
          this.setDatetime(datetime);

        }
      }, this));

      this.$calendar.on('click.datetime.nav', 'button', $.proxy(function (event) {
        var data = $(event.target).data(), datetime;
        if (data.prev !== undefined) {
          datetime = moment(this.datetimeDate).subtract('months', 1);
        } else if (data.next !== undefined) {
          datetime = moment(this.datetimeDate).add('months', 1);
        } else if (data.today !== undefined) {
          datetime = moment();
        }
        this.setDatetime(datetime);
      }, this));

      this.$calendar.on('click.datetime', function (event) {
        event.stopPropagation();
      });

      return this.$calendar;

    },

    widget: function () {
      return this.calendar();
    },

    show: function () {
      var $calendar = this.calendar(),
          offset = this.$element.offset();

      $calendar.appendTo('body');

      $calendar.offset({
        top: offset.top + this.$element.outerHeight(),
        left: offset.left
      });
    },

    hide: function () {
      var $calendar = this.calendar();
      $calendar.detach();
    }
  };


 /* CALENDAR PLUGIN DEFINITION
  * ========================== */

  $.fn.datetime = function (option) {

    if (typeof option === "string" && option === "widget") {
      return $(this).data('datetime')[option]();
    }

    return this.each(function () {
      var $this   = $(this),
          data    = $this.data('datetime'),
          options = typeof option === 'object' && option;

      if (!data) {
        $this.data('datetime', (data = new Datetime(this, options)));
      }

      if (typeof option === 'string') {
        data[option]();
      }
    });
  };

  $.fn.datetime.Constructor = Datetime;

  $.fn.datetime.defaults = {
    polyfill: true,
    // format
    format: 'MM/DD/YYYY hh:mm A'
  };


 /* CALENDAR DATA-API
  * ================= */

  $(window).on('load', function () {
    $('[type=datetime-local]').each(function () {

      var $element = $(this),
          data     = $element.data();

      $element.datetime(data);

    });
  });


}(window.jQuery));

(function ($) {

  "use strict";

  var Dropzone = function (element) {
    this.init(element);
  };

  Dropzone.prototype = {
    init: function (element) {

      this.$element = $(element);

      this._observeWindow();
      this._observeElement();

    },

    _observeWindow: function () {

      var windowlayer = 0;

      // prevent miss-drops
      $(window).on({
        dragover: function (event) {
          event.preventDefault();
        },
        dragenter: $.proxy(function (event) {
          event.preventDefault();
          windowlayer++;
          if (windowlayer) {
            this.$element.trigger('dropzonewindowenter');
          }
        }, this),
        dragleave: $.proxy(function (event) {
          event.preventDefault();
          windowlayer--;
          if (!windowlayer) {
            this.$element.trigger('dropzonewindowleave');
          }
        }, this),
        drop: $.proxy(function (event) {
          event.preventDefault();
          windowlayer = 0;
          this.$element.trigger('dropzonewindowdrop');
        }, this)
      });

    },

    _observeElement: function () {

      var dropzonelayer = 0;

      // Handle drag and drop from OS.
      this.$element.on({
        dragover: function (event) {
          event.preventDefault();
          event.originalEvent.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
        },
        dragenter: $.proxy(function (event) {
          event.preventDefault();
          dropzonelayer++;
          if (dropzonelayer === 1) {
            this.$element.trigger('dropzoneenter', event);
          }
        }, this),
        dragleave: $.proxy(function (event) {
          event.preventDefault();
          dropzonelayer--;
          if (!dropzonelayer) {
            this.$element.trigger('dopzoneleave', event);
          }
        }, this),
        drop: function (event) {
          event.preventDefault();
          dropzonelayer = 0;
        }
      });

    }
  };

  /* DROPZONE PLUGIN DEFINITION
   * ========================== */

  $.fn.dropzone = function (option) {

    var uploadArguments = arguments;

    return this.each(function () {
      var $this   = $(this),
          data    = $this.data('dropzone'),
          options = typeof option === 'object' && option;

      if (!data) {
        $this.data('dropzone', (data = new Dropzone(this, options)));
      }

      if (typeof option === 'string') {
        data[option].apply(data, Array.prototype.slice.call(uploadArguments, 1));
      }
    });

  };

  $.fn.dropzone.Constructor = Dropzone;

  $.fn.dropzone.defaults = {};

 /* DROPZONE DATA-API
  * ================= */

  $(window).on('load', function () {
    $('[data-dropzone]').each(function () {

      var $element = $(this),
          data     = $element.data();

      $element.dropzone(data);

    });
  });

}(window.jQuery));

(function ($) {

  "use strict";

  var SelectFile = function () {
    this.init.apply(this, arguments);
  };

  SelectFile.prototype = {
    init: function (element, options) {

      this.$element = $(element);

      this.options = this._getOptions(options);

      // We need this for OS file selection
      this.$fileinput = $('<input type="file">').hide().appendTo('body');

      // Only accept certain filetypes?
      if (this.options.accept) {
        this.$fileinput.attr('accept', this.options.accept);
      }

      // Allow multiple file selection?
      if (this.options.multiple) {
        this.$fileinput.attr('multiple', true);
      }

      this.observeFileInput();

      this.$element.on('click', $.proxy(this.selectFile, this));

      return arguments;

    },

    _getOptions: function (options) {
      return $.extend({}, $.fn.selectFile.defaults, this.$element.data(), options);
    },

    observeFileInput: function () {
      var self = this;
      this.$fileinput
        .off('change')
        .off('click')
        .on('change', function () {

          $.each(this.files, function (index, file) {
            self.$element.trigger('selectedFile', file);
          });

          // reset file input
          self.$fileinput = $(this).clone();
          $(this).replaceWith(self.$fileInput);
          self.observeFileInput();
        })
        .on('click', function (event) {
          event.stopPropagation();
        });
    },

    selectFile: function () {
      this.$fileinput.trigger('click');
    }

  };


  /* SELECT FILE PLUGIN DEFINITION
   * ======================== */

  $.fn.selectFile = function (option) {

    var selectFileArguments = arguments;

    return this.each(function () {
      var $this   = $(this),
          data    = $this.data('selectFile'),
          options = typeof option === 'object' && option;

      if (!data) {
        $this.data('selectFile', (data = new SelectFile(this, options)));
      }

      if (typeof option === 'string') {
        data[option].apply(data, Array.prototype.slice.call(selectFileArguments, 1));
      }
    });

  };

  $.fn.selectFile.Constructor = SelectFile;

  $.fn.selectFile.defaults = {
    multiple: false,
    accept: null
  };

}(window.jQuery));

(function ($) {

  "use strict";

  var Tab = function (element, options) {
    this.init(element, options);
  };

  Tab.prototype = {
    init: function (element, options) {
      this.$element = $(element);
      this.options = this.getOptions(options);
    },

    getOptions: function (options) {
      return $.extend({}, $.fn.tab.defaults, this.$element.closest('[data-toggle-group]').data(), this.$element.data(), options);
    },

    show: function () {

      var selector, $target, $targetGroup, groupOptions;

      this.$element.closest('[data-toggle-group]').find('[data-toggle]').parent().removeClass(this.options.activetabclass);
      this.$element.parent().addClass(this.options.activetabclass);

      selector = this.$element.attr('href');
      selector = selector && selector.replace(/.*(?=#[^\s]*$)/, '');

      $target = $(selector);
      $targetGroup = $target.closest('[data-toggle-target-group]');

      groupOptions = $.extend({}, this.options, $targetGroup.data());

      $targetGroup.children().removeClass(groupOptions.activepaneclass);
      $target.addClass(groupOptions.activepaneclass);

    }
  };


 /* TAB PLUGIN DEFINITION
  * ===================== */

  $.fn.tab = function (option) {
    return this.each(function () {
      var $this   = $(this),
          data    = $this.data('tab'),
          options = typeof option === 'object' && option;

      if (!data) {
        $this.data('tab', (data = new Tab(this, options)));
      }

      if (typeof option === 'string') {
        data[option]();
      }
    });
  };

  $.fn.tab.Constructor = Tab;

  $.fn.tab.defaults = {
    activetabclass: 'active',
    activepaneclass: 'active'
  };


 /* TAB DATA-API
  * ============== */

  $(document).on('click.tab.data-api', '[data-toggle=tab]', function (e) {
    e.preventDefault();
    $(this).tab('show');
  });

}(window.jQuery));

(function ($) {

  "use strict";


  /* TOOLTIP PUBLIC CLASS DEFINITION
   * =============================== */

  var Tooltip = function (element, options) {
    this.init('tooltip', element, options);
  };

  Tooltip.prototype = {
    constructor: Tooltip,

    init: function (type, element, options) {
      this.type     = type;
      this.$element = $(element);
      this.options  = this.getOptions(options);
      this.enabled  = true;

      this.fixTitle();

      this.$element.on('mouseenter.tooltip', $.proxy(this.show, this));
      this.$element.on('mouseleave.tooltip', $.proxy(this.hide, this));

    },

    getOptions: function (options) {
      return $.extend({}, $.fn[this.type].defaults, this.$element.data(), options);
    },

    fixTitle: function () {
      var $element = this.$element;
      $element.attr('data-original-title', this.options.title || $element.attr('title') || '').attr('title', '');
    },

    getTitle: function () {
      return this.$element.attr('data-original-title');
    },

    tip: function () {
      return this.$tip = this.$tip || $(this.options.template);
    },

    adjustPosition: function () {
      var $tip = this.tip(),
          elementOffset = this.$element.offset(),
          tipOffset = {},
          placement = this.options.placement;

      if (placement === "top" || placement === "bottom") {
        tipOffset.left = elementOffset.left - (($tip.outerWidth() - this.$element.outerWidth()) / 2);
      }

      if (placement === "right" || placement === "left") {
        tipOffset.top = elementOffset.top - (($tip.outerHeight() - this.$element.outerHeight()) / 2);
      }

      if (placement === "top") {
        tipOffset.top = elementOffset.top - $tip.outerHeight() - 5;
      }

      if (placement === "bottom") {
        tipOffset.top = elementOffset.top + this.$element.outerHeight() + 5;
      }

      if (placement === "right") {
        tipOffset.left = elementOffset.left + this.$element.outerWidth() + 5;
      }

      if (placement === "left") {
        tipOffset.left = elementOffset.left - this.$tip.outerWidth() - 5;
      }

      $tip.offset(tipOffset).removeClass("top right bottom left").addClass(placement);

    },

    setContent: function (content) {
      this.tip().find('.wy-tooltip-inner')[this.options.html ? 'html' : 'text'](content || this.getTitle());
    },

    show: function () {
      var $tip = this.tip();
      this.setContent();
      $tip.addClass('on');
      $tip.insertAfter(this.$element);
      this.adjustPosition();
    },

    hide: function () {
      var $tip = this.tip();
      $tip.removeClass('on');
      $tip.detach();
    },

    enable: function () {
      this.enabled = true;
    },

    disable: function () {
      this.enabled = false;
    },

    destroy: function () {

    }

  };


  /* TOOLTIP PLUGIN DEFINITION
   * ========================= */

  $.fn.tooltip = function (option) {
    return this.each(function () {
      var $this   = $(this),
          data    = $this.data('tooltip'),
          options = typeof option === 'object' && option;

      if (!data) {
        $this.data('tooltip', (data = new Tooltip(this, options)));
      }

      if (typeof option === 'string') {
        data[option]();
      }
    });
  };

  $.fn.tooltip.Constructor = Tooltip;

  $.fn.tooltip.defaults = {
    placement: 'top',
    template : '<div class="wy-tooltip"><div class="wy-tooltip-arrow"></div><div class="wy-tooltip-inner"></div></div>',
    title    : '',
    html     : false
  };


 /* TOOLTIP DATA-API
  * ================ */

  $(document).on('mouseenter', '[data-toggle="tooltip"]', function () {
    var $element = $(this),
        data     = $element.data();

    $element.tooltip(data);
    $element.tooltip('show');
  });

}(window.jQuery));

(function ($) {

  "use strict";

  var Uploader = function () {
    this.init.apply(this, arguments);
  };

  Uploader.prototype = {
    init: function (url, uploadSite, uploadToken, options) {
      this.url         = url;
      this.uploadSite  = uploadSite;
      this.uploadToken = uploadToken;
      this.options     = options;
    },

    upload: function (file) {
      if (typeof file === 'string') {
        return this.uploadUrl(file);
      } else {
        return this.uploadFile(file);
      }
    },

    uploadFile: function (file) {

      var data = new FormData();
      data.append('payload', file);
      data.append('site', this.uploadSite);
      data.append('token', this.uploadToken);

      if (this.options && this.options.data) {
        $.each(this.options.data, function (key, value) {
          data.append(key, value);
        });
      }

      var dfd = $.Deferred();

      $.ajax({

        // Upload progress
        xhr: function () {
          var xhr = new window.XMLHttpRequest();
          xhr.upload.addEventListener("progress", function (event) {
            if (event.lengthComputable) {
              dfd.notify(event);
            }
          }, false);
          return xhr;
        },

        url: this.url + 'upload-file/',
        type: 'post',
        data: data,
        dataType: 'json',
        contentType: false,
        processData: false
      }).done(function () {
        dfd.resolve.apply(this, arguments);
      }).fail(function () {
        dfd.reject.apply(this, arguments);
      }).always(function () {
        dfd.always.apply(this, arguments);
      });

      return dfd;

    },

    uploadUrl: function (url) {

      var data = {
        url  : url,
        site : this.uploadSite,
        token: this.uploadToken
      };

      if (this.options && this.options.data) {
        $.each(this.options.data, function (key, value) {
          data[key] = value;
        });
      }

      return $.ajax({
        url: this.url + 'upload-url/',
        type: 'post',
        data: data,
        dataType: 'json'
      });
    }
  };

  window.Webhook = window.Webhook || {};
  window.Webhook.Uploader = Uploader;

}(window.jQuery));
