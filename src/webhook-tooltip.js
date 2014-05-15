/*
 * Webhook Tooltip
 * https://github.com/webhook/webhook-js
 *
 * Copyright (c) 2013
 * Licensed under the MIT license.
 */

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
