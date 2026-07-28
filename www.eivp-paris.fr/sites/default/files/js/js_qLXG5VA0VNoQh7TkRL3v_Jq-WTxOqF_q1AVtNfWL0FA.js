/* global a2a*/
(function (Drupal) {
  'use strict';

  Drupal.behaviors.addToAny = {
    attach: function (context, settings) {
      // If not the full document (it's probably AJAX), and window.a2a exists
      if (context !== document && window.a2a) {
        a2a.init_all(); // Init all uninitiated AddToAny instances
      }
    }
  };

})(Drupal);
;
/**
 * @file
 * Attaches several event listener to a web page.
 */

(function ($, Drupal, drupalSettings) {

  /* eslint max-nested-callbacks: ["error", 4] */

  'use strict';

  Drupal.google_analytics = {};

  $(document).ready(function () {

    // Attach mousedown, keyup, touchstart events to document only and catch
    // clicks on all elements.
    $(document.body).on('mousedown keyup touchstart', function (event) {

      // Catch the closest surrounding link of a clicked element.
      $(event.target).closest('a,area').each(function () {

        // Is the clicked URL internal?
        if (Drupal.google_analytics.isInternal(this.href)) {
          // Skip 'click' tracking, if custom tracking events are bound.
          if ($(this).is('.colorbox') && (drupalSettings.google_analytics.trackColorbox)) {
            // Do nothing here. The custom event will handle all tracking.
            // console.info('Click on .colorbox item has been detected.');
          }
          // Is download tracking activated and the file extension configured
          // for download tracking?
          else if (drupalSettings.google_analytics.trackDownload && Drupal.google_analytics.isDownload(this.href)) {
            // Download link clicked.
            ga('send', {
              hitType: 'event',
              eventCategory: 'Downloads',
              eventAction: Drupal.google_analytics.getDownloadExtension(this.href).toUpperCase(),
              eventLabel: Drupal.google_analytics.getPageUrl(this.href),
              transport: 'beacon'
            });
          }
          else if (Drupal.google_analytics.isInternalSpecial(this.href)) {
            // Keep the internal URL for Google Analytics website overlay intact.
            ga('send', {
              hitType: 'pageview',
              page: Drupal.google_analytics.getPageUrl(this.href),
              transport: 'beacon'
            });
          }
        }
        else {
          if (drupalSettings.google_analytics.trackMailto && $(this).is("a[href^='mailto:'],area[href^='mailto:']")) {
            // Mailto link clicked.
            ga('send', {
              hitType: 'event',
              eventCategory: 'Mails',
              eventAction: 'Click',
              eventLabel: this.href.substring(7),
              transport: 'beacon'
            });
          }
          else if (drupalSettings.google_analytics.trackOutbound && this.href.match(/^\w+:\/\//i)) {
            if (drupalSettings.google_analytics.trackDomainMode !== 2 || (drupalSettings.google_analytics.trackDomainMode === 2 && !Drupal.google_analytics.isCrossDomain(this.hostname, drupalSettings.google_analytics.trackCrossDomains))) {
              // External link clicked / No top-level cross domain clicked.
              ga('send', {
                hitType: 'event',
                eventCategory: 'Outbound links',
                eventAction: 'Click',
                eventLabel: this.href,
                transport: 'beacon'
              });
            }
          }
        }
      });
    });

    // Track hash changes as unique pageviews, if this option has been enabled.
    if (drupalSettings.google_analytics.trackUrlFragments) {
      window.onhashchange = function () {
        ga('send', {
          hitType: 'pageview',
          page: location.pathname + location.search + location.hash
        });
      };
    }

    // Colorbox: This event triggers when the transition has completed and the
    // newly loaded content has been revealed.
    if (drupalSettings.google_analytics.trackColorbox) {
      $(document).on('cbox_complete', function () {
        var href = $.colorbox.element().attr('href');
        if (href) {
          ga('send', {
            hitType: 'pageview',
            page: Drupal.google_analytics.getPageUrl(href)
          });
        }
      });
    }

  });

  /**
   * Check whether the hostname is part of the cross domains or not.
   *
   * @param {string} hostname
   *   The hostname of the clicked URL.
   * @param {array} crossDomains
   *   All cross domain hostnames as JS array.
   *
   * @return {boolean} isCrossDomain
   */
  Drupal.google_analytics.isCrossDomain = function (hostname, crossDomains) {
    return $.inArray(hostname, crossDomains) > -1 ? true : false;
  };

  /**
   * Check whether this is a download URL or not.
   *
   * @param {string} url
   *   The web url to check.
   *
   * @return {boolean} isDownload
   */
  Drupal.google_analytics.isDownload = function (url) {
    var isDownload = new RegExp('\\.(' + drupalSettings.google_analytics.trackDownloadExtensions + ')([\?#].*)?$', 'i');
    return isDownload.test(url);
  };

  /**
   * Check whether this is an absolute internal URL or not.
   *
   * @param {string} url
   *   The web url to check.
   *
   * @return {boolean} isInternal
   */
  Drupal.google_analytics.isInternal = function (url) {
    var isInternal = new RegExp('^(https?):\/\/' + window.location.host, 'i');
    return isInternal.test(url);
  };

  /**
   * Check whether this is a special URL or not.
   *
   * URL types:
   *  - gotwo.module /go/* links.
   *
   * @param {string} url
   *   The web url to check.
   *
   * @return {boolean} isInternalSpecial
   */
  Drupal.google_analytics.isInternalSpecial = function (url) {
    var isInternalSpecial = new RegExp('(\/go\/.*)$', 'i');
    return isInternalSpecial.test(url);
  };

  /**
   * Extract the relative internal URL from an absolute internal URL.
   *
   * Examples:
   * - https://mydomain.com/node/1 -> /node/1
   * - https://example.com/foo/bar -> https://example.com/foo/bar
   *
   * @param {string} url
   *   The web url to check.
   *
   * @return {string} getPageUrl
   *   Internal website URL.
   */
  Drupal.google_analytics.getPageUrl = function (url) {
    var extractInternalUrl = new RegExp('^(https?):\/\/' + window.location.host, 'i');
    return url.replace(extractInternalUrl, '');
  };

  /**
   * Extract the download file extension from the URL.
   *
   * @param {string} url
   *   The web url to check.
   *
   * @return {string} getDownloadExtension
   *   The file extension of the passed url. e.g. 'zip', 'txt'
   */
  Drupal.google_analytics.getDownloadExtension = function (url) {
    var extractDownloadextension = new RegExp('\\.(' + drupalSettings.google_analytics.trackDownloadExtensions + ')([\?#].*)?$', 'i');
    var extension = extractDownloadextension.exec(url);
    return (extension === null) ? '' : extension[1];
  };

})(jQuery, Drupal, drupalSettings);
;
/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/

(function ($, once) {
  var deprecatedMessageSuffix = "is deprecated in Drupal 9.3.0 and will be removed in Drupal 10.0.0. Use the core/once library instead. See https://www.drupal.org/node/3158256";
  var originalJQOnce = $.fn.once;
  var originalJQRemoveOnce = $.fn.removeOnce;

  $.fn.once = function jQueryOnce(id) {
    Drupal.deprecationError({
      message: "jQuery.once() ".concat(deprecatedMessageSuffix)
    });
    return originalJQOnce.apply(this, [id]);
  };

  $.fn.removeOnce = function jQueryRemoveOnce(id) {
    Drupal.deprecationError({
      message: "jQuery.removeOnce() ".concat(deprecatedMessageSuffix)
    });
    return originalJQRemoveOnce.apply(this, [id]);
  };

  var drupalOnce = once;

  function augmentedOnce(id, selector, context) {
    originalJQOnce.apply($(selector, context), [id]);
    return drupalOnce(id, selector, context);
  }

  function remove(id, selector, context) {
    originalJQRemoveOnce.apply($(selector, context), [id]);
    return drupalOnce.remove(id, selector, context);
  }

  window.once = Object.assign(augmentedOnce, drupalOnce, {
    remove: remove
  });
})(jQuery, once);;
/**
 * @file
 * JS for Radix.
 */
(function ($, Drupal, window, document, undefined) {
  // Allow dropdown links to be clickable by showing dropdowns on hover/focus.
  // Most of the work done here was implemented after an accessibility study.
  // @see https://www.drupal.org/node/2500635
  Drupal.behaviors.radix_dropdown = {
    attach: function(context) {
      var $context = $(context);

      $context.find('.dropdown').once('radix-dropdown').each(function () {
        var dropdown = this;

        // Helper function to show the dropdown.
        function show() {
          if (!$(dropdown).hasClass('open')) {
            $('>[data-toggle="dropdown"]', dropdown).trigger('click.bs.dropdown');
          }
        }

        // Helper function to hide the dropdown.
        function hide() {
          if ($(dropdown).hasClass('open')) {
            $('>[data-toggle="dropdown"]', dropdown).trigger('click.bs.dropdown');
          }
        }

        // Show dropdown on hover and focus.
        $(this).on('mouseenter.radix.dropdown', function(e) {
          show();
        });
        $(this).on('mouseleave.radix.dropdown', function() {
          hide();
        });

        $(this).on('keydown.radix.dropdown', function(e) {
          // Prevent up/down arrow from doing anything -- they conflict with
          // using focus to show the dropdown, and the default Bootstrap keydown
          // handler will trigger our click handler to visit the link.
          if (e.keyCode == 38 || e.keyCode == 40) {
            return false;
          }
          // Show/hide dropdown with spacebar.
          if (e.keyCode == 32) {
            $('>[data-toggle="dropdown"]', dropdown).trigger('click.bs.dropdown');
            return false;
          }
          // Hide the dropdown with the escape hey.
          if (e.keyCode == 27) {
            // Leave focus on the parent after it's hidden.
            $('>[data-toggle="dropdown"]', dropdown).focus();
            hide();
            return false;
          }
        });

        // Allow a.dropdown-toggle to be clickable.
        if ($(this).has('> a.dropdown-toggle')) {
          $(this).on('click.radix.dropdown', function(e) {
            var $target = $(e.target);
            if ($target.parent().get(0) == dropdown && $target.is('a.dropdown-toggle') && $target.attr('href')) {
              e.preventDefault();
              window.location.href = $target.attr('href');
            }
          });
        }
      });

      $context.find('body').once('radix-dropdown-focus').on('focusout.radix.dropdown', function(e) {
        var parent = $(e.target).closest('li.radix-dropdown-processed.open').get(0);
        if (parent) {
          // Defer to after all handlers so we can see where focus landed.
          setTimeout(function () {
            // Don't do anything if no element is focused - that can only
            // happen with the mouse and this is meant to close the menu
            // when the keyboard is used to change focus.
            if (!document.activeElement || document.activeElement === document.body) {
              return;
            }
            // Hide the parent if it doesn't contain the now focused element
            // and is still open.
            if (!parent.contains(document.activeElement) && $(parent).hasClass('open')) {
              $(parent).trigger('click.bs.dropdown');
            }
          }, 0);
        }
      });
    }
  };

  // Bootstrap tooltip.
  Drupal.behaviors.radix_tooltip = {
    attach: function(context, setting) {
      if ($.fn.tooltip) {
        $("[data-toggle='tooltip']").tooltip();
      }
    }
  };

  // Bootstrap popover.
  Drupal.behaviors.radix_popover = {
    attach: function(context, setting) {
      if ($.fn.popover) {
        $("[data-toggle='popover']").popover();
      }
    }
  };

  $(document).ready(function() {
    // Show first tab by default.
    // Ignore the "primary" tabs on the node edit page.
    if ($.fn.tab) {
      var tabs = $('.nav-tabs').not('.primary');
      tabs.children('li').first().find('a').tab('show');

      if (hash = window.location.hash) {
        $('.nav-tabs > li > a[href$="' + hash + '"]').tab('show');
      }
    }
  });
})(jQuery, Drupal, this, this.document);
;
/*!
 * Bootstrap v3.3.7 (http://getbootstrap.com)
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under the MIT license
 */
if("undefined"==typeof jQuery)throw new Error("Bootstrap's JavaScript requires jQuery");+function(a){"use strict";var b=a.fn.jquery.split(" ")[0].split(".");if(b[0]<2&&b[1]<9||1==b[0]&&9==b[1]&&b[2]<1||b[0]>3)throw new Error("Bootstrap's JavaScript requires jQuery version 1.9.1 or higher, but lower than version 4")}(jQuery),+function(a){"use strict";function b(){var a=document.createElement("bootstrap"),b={WebkitTransition:"webkitTransitionEnd",MozTransition:"transitionend",OTransition:"oTransitionEnd otransitionend",transition:"transitionend"};for(var c in b)if(void 0!==a.style[c])return{end:b[c]};return!1}a.fn.emulateTransitionEnd=function(b){var c=!1,d=this;a(this).one("bsTransitionEnd",function(){c=!0});var e=function(){c||a(d).trigger(a.support.transition.end)};return setTimeout(e,b),this},a(function(){a.support.transition=b(),a.support.transition&&(a.event.special.bsTransitionEnd={bindType:a.support.transition.end,delegateType:a.support.transition.end,handle:function(b){if(a(b.target).is(this))return b.handleObj.handler.apply(this,arguments)}})})}(jQuery),+function(a){"use strict";function b(b){return this.each(function(){var c=a(this),e=c.data("bs.alert");e||c.data("bs.alert",e=new d(this)),"string"==typeof b&&e[b].call(c)})}var c='[data-dismiss="alert"]',d=function(b){a(b).on("click",c,this.close)};d.VERSION="3.3.7",d.TRANSITION_DURATION=150,d.prototype.close=function(b){function c(){g.detach().trigger("closed.bs.alert").remove()}var e=a(this),f=e.attr("data-target");f||(f=e.attr("href"),f=f&&f.replace(/.*(?=#[^\s]*$)/,""));var g=a("#"===f?[]:f);b&&b.preventDefault(),g.length||(g=e.closest(".alert")),g.trigger(b=a.Event("close.bs.alert")),b.isDefaultPrevented()||(g.removeClass("in"),a.support.transition&&g.hasClass("fade")?g.one("bsTransitionEnd",c).emulateTransitionEnd(d.TRANSITION_DURATION):c())};var e=a.fn.alert;a.fn.alert=b,a.fn.alert.Constructor=d,a.fn.alert.noConflict=function(){return a.fn.alert=e,this},a(document).on("click.bs.alert.data-api",c,d.prototype.close)}(jQuery),+function(a){"use strict";function b(b){return this.each(function(){var d=a(this),e=d.data("bs.button"),f="object"==typeof b&&b;e||d.data("bs.button",e=new c(this,f)),"toggle"==b?e.toggle():b&&e.setState(b)})}var c=function(b,d){this.$element=a(b),this.options=a.extend({},c.DEFAULTS,d),this.isLoading=!1};c.VERSION="3.3.7",c.DEFAULTS={loadingText:"loading..."},c.prototype.setState=function(b){var c="disabled",d=this.$element,e=d.is("input")?"val":"html",f=d.data();b+="Text",null==f.resetText&&d.data("resetText",d[e]()),setTimeout(a.proxy(function(){d[e](null==f[b]?this.options[b]:f[b]),"loadingText"==b?(this.isLoading=!0,d.addClass(c).attr(c,c).prop(c,!0)):this.isLoading&&(this.isLoading=!1,d.removeClass(c).removeAttr(c).prop(c,!1))},this),0)},c.prototype.toggle=function(){var a=!0,b=this.$element.closest('[data-toggle="buttons"]');if(b.length){var c=this.$element.find("input");"radio"==c.prop("type")?(c.prop("checked")&&(a=!1),b.find(".active").removeClass("active"),this.$element.addClass("active")):"checkbox"==c.prop("type")&&(c.prop("checked")!==this.$element.hasClass("active")&&(a=!1),this.$element.toggleClass("active")),c.prop("checked",this.$element.hasClass("active")),a&&c.trigger("change")}else this.$element.attr("aria-pressed",!this.$element.hasClass("active")),this.$element.toggleClass("active")};var d=a.fn.button;a.fn.button=b,a.fn.button.Constructor=c,a.fn.button.noConflict=function(){return a.fn.button=d,this},a(document).on("click.bs.button.data-api",'[data-toggle^="button"]',function(c){var d=a(c.target).closest(".btn");b.call(d,"toggle"),a(c.target).is('input[type="radio"], input[type="checkbox"]')||(c.preventDefault(),d.is("input,button")?d.trigger("focus"):d.find("input:visible,button:visible").first().trigger("focus"))}).on("focus.bs.button.data-api blur.bs.button.data-api",'[data-toggle^="button"]',function(b){a(b.target).closest(".btn").toggleClass("focus",/^focus(in)?$/.test(b.type))})}(jQuery),+function(a){"use strict";function b(b){return this.each(function(){var d=a(this),e=d.data("bs.carousel"),f=a.extend({},c.DEFAULTS,d.data(),"object"==typeof b&&b),g="string"==typeof b?b:f.slide;e||d.data("bs.carousel",e=new c(this,f)),"number"==typeof b?e.to(b):g?e[g]():f.interval&&e.pause().cycle()})}var c=function(b,c){this.$element=a(b),this.$indicators=this.$element.find(".carousel-indicators"),this.options=c,this.paused=null,this.sliding=null,this.interval=null,this.$active=null,this.$items=null,this.options.keyboard&&this.$element.on("keydown.bs.carousel",a.proxy(this.keydown,this)),"hover"==this.options.pause&&!("ontouchstart"in document.documentElement)&&this.$element.on("mouseenter.bs.carousel",a.proxy(this.pause,this)).on("mouseleave.bs.carousel",a.proxy(this.cycle,this))};c.VERSION="3.3.7",c.TRANSITION_DURATION=600,c.DEFAULTS={interval:5e3,pause:"hover",wrap:!0,keyboard:!0},c.prototype.keydown=function(a){if(!/input|textarea/i.test(a.target.tagName)){switch(a.which){case 37:this.prev();break;case 39:this.next();break;default:return}a.preventDefault()}},c.prototype.cycle=function(b){return b||(this.paused=!1),this.interval&&clearInterval(this.interval),this.options.interval&&!this.paused&&(this.interval=setInterval(a.proxy(this.next,this),this.options.interval)),this},c.prototype.getItemIndex=function(a){return this.$items=a.parent().children(".item"),this.$items.index(a||this.$active)},c.prototype.getItemForDirection=function(a,b){var c=this.getItemIndex(b),d="prev"==a&&0===c||"next"==a&&c==this.$items.length-1;if(d&&!this.options.wrap)return b;var e="prev"==a?-1:1,f=(c+e)%this.$items.length;return this.$items.eq(f)},c.prototype.to=function(a){var b=this,c=this.getItemIndex(this.$active=this.$element.find(".item.active"));if(!(a>this.$items.length-1||a<0))return this.sliding?this.$element.one("slid.bs.carousel",function(){b.to(a)}):c==a?this.pause().cycle():this.slide(a>c?"next":"prev",this.$items.eq(a))},c.prototype.pause=function(b){return b||(this.paused=!0),this.$element.find(".next, .prev").length&&a.support.transition&&(this.$element.trigger(a.support.transition.end),this.cycle(!0)),this.interval=clearInterval(this.interval),this},c.prototype.next=function(){if(!this.sliding)return this.slide("next")},c.prototype.prev=function(){if(!this.sliding)return this.slide("prev")},c.prototype.slide=function(b,d){var e=this.$element.find(".item.active"),f=d||this.getItemForDirection(b,e),g=this.interval,h="next"==b?"left":"right",i=this;if(f.hasClass("active"))return this.sliding=!1;var j=f[0],k=a.Event("slide.bs.carousel",{relatedTarget:j,direction:h});if(this.$element.trigger(k),!k.isDefaultPrevented()){if(this.sliding=!0,g&&this.pause(),this.$indicators.length){this.$indicators.find(".active").removeClass("active");var l=a(this.$indicators.children()[this.getItemIndex(f)]);l&&l.addClass("active")}var m=a.Event("slid.bs.carousel",{relatedTarget:j,direction:h});return a.support.transition&&this.$element.hasClass("slide")?(f.addClass(b),f[0].offsetWidth,e.addClass(h),f.addClass(h),e.one("bsTransitionEnd",function(){f.removeClass([b,h].join(" ")).addClass("active"),e.removeClass(["active",h].join(" ")),i.sliding=!1,setTimeout(function(){i.$element.trigger(m)},0)}).emulateTransitionEnd(c.TRANSITION_DURATION)):(e.removeClass("active"),f.addClass("active"),this.sliding=!1,this.$element.trigger(m)),g&&this.cycle(),this}};var d=a.fn.carousel;a.fn.carousel=b,a.fn.carousel.Constructor=c,a.fn.carousel.noConflict=function(){return a.fn.carousel=d,this};var e=function(c){var d,e=a(this),f=a(e.attr("data-target")||(d=e.attr("href"))&&d.replace(/.*(?=#[^\s]+$)/,""));if(f.hasClass("carousel")){var g=a.extend({},f.data(),e.data()),h=e.attr("data-slide-to");h&&(g.interval=!1),b.call(f,g),h&&f.data("bs.carousel").to(h),c.preventDefault()}};a(document).on("click.bs.carousel.data-api","[data-slide]",e).on("click.bs.carousel.data-api","[data-slide-to]",e),a(window).on("load",function(){a('[data-ride="carousel"]').each(function(){var c=a(this);b.call(c,c.data())})})}(jQuery),+function(a){"use strict";function b(b){var c,d=b.attr("data-target")||(c=b.attr("href"))&&c.replace(/.*(?=#[^\s]+$)/,"");return a(d)}function c(b){return this.each(function(){var c=a(this),e=c.data("bs.collapse"),f=a.extend({},d.DEFAULTS,c.data(),"object"==typeof b&&b);!e&&f.toggle&&/show|hide/.test(b)&&(f.toggle=!1),e||c.data("bs.collapse",e=new d(this,f)),"string"==typeof b&&e[b]()})}var d=function(b,c){this.$element=a(b),this.options=a.extend({},d.DEFAULTS,c),this.$trigger=a('[data-toggle="collapse"][href="#'+b.id+'"],[data-toggle="collapse"][data-target="#'+b.id+'"]'),this.transitioning=null,this.options.parent?this.$parent=this.getParent():this.addAriaAndCollapsedClass(this.$element,this.$trigger),this.options.toggle&&this.toggle()};d.VERSION="3.3.7",d.TRANSITION_DURATION=350,d.DEFAULTS={toggle:!0},d.prototype.dimension=function(){var a=this.$element.hasClass("width");return a?"width":"height"},d.prototype.show=function(){if(!this.transitioning&&!this.$element.hasClass("in")){var b,e=this.$parent&&this.$parent.children(".panel").children(".in, .collapsing");if(!(e&&e.length&&(b=e.data("bs.collapse"),b&&b.transitioning))){var f=a.Event("show.bs.collapse");if(this.$element.trigger(f),!f.isDefaultPrevented()){e&&e.length&&(c.call(e,"hide"),b||e.data("bs.collapse",null));var g=this.dimension();this.$element.removeClass("collapse").addClass("collapsing")[g](0).attr("aria-expanded",!0),this.$trigger.removeClass("collapsed").attr("aria-expanded",!0),this.transitioning=1;var h=function(){this.$element.removeClass("collapsing").addClass("collapse in")[g](""),this.transitioning=0,this.$element.trigger("shown.bs.collapse")};if(!a.support.transition)return h.call(this);var i=a.camelCase(["scroll",g].join("-"));this.$element.one("bsTransitionEnd",a.proxy(h,this)).emulateTransitionEnd(d.TRANSITION_DURATION)[g](this.$element[0][i])}}}},d.prototype.hide=function(){if(!this.transitioning&&this.$element.hasClass("in")){var b=a.Event("hide.bs.collapse");if(this.$element.trigger(b),!b.isDefaultPrevented()){var c=this.dimension();this.$element[c](this.$element[c]())[0].offsetHeight,this.$element.addClass("collapsing").removeClass("collapse in").attr("aria-expanded",!1),this.$trigger.addClass("collapsed").attr("aria-expanded",!1),this.transitioning=1;var e=function(){this.transitioning=0,this.$element.removeClass("collapsing").addClass("collapse").trigger("hidden.bs.collapse")};return a.support.transition?void this.$element[c](0).one("bsTransitionEnd",a.proxy(e,this)).emulateTransitionEnd(d.TRANSITION_DURATION):e.call(this)}}},d.prototype.toggle=function(){this[this.$element.hasClass("in")?"hide":"show"]()},d.prototype.getParent=function(){return a(this.options.parent).find('[data-toggle="collapse"][data-parent="'+this.options.parent+'"]').each(a.proxy(function(c,d){var e=a(d);this.addAriaAndCollapsedClass(b(e),e)},this)).end()},d.prototype.addAriaAndCollapsedClass=function(a,b){var c=a.hasClass("in");a.attr("aria-expanded",c),b.toggleClass("collapsed",!c).attr("aria-expanded",c)};var e=a.fn.collapse;a.fn.collapse=c,a.fn.collapse.Constructor=d,a.fn.collapse.noConflict=function(){return a.fn.collapse=e,this},a(document).on("click.bs.collapse.data-api",'[data-toggle="collapse"]',function(d){var e=a(this);e.attr("data-target")||d.preventDefault();var f=b(e),g=f.data("bs.collapse"),h=g?"toggle":e.data();c.call(f,h)})}(jQuery),+function(a){"use strict";function b(b){var c=b.attr("data-target");c||(c=b.attr("href"),c=c&&/#[A-Za-z]/.test(c)&&c.replace(/.*(?=#[^\s]*$)/,""));var d=c&&a(c);return d&&d.length?d:b.parent()}function c(c){c&&3===c.which||(a(e).remove(),a(f).each(function(){var d=a(this),e=b(d),f={relatedTarget:this};e.hasClass("open")&&(c&&"click"==c.type&&/input|textarea/i.test(c.target.tagName)&&a.contains(e[0],c.target)||(e.trigger(c=a.Event("hide.bs.dropdown",f)),c.isDefaultPrevented()||(d.attr("aria-expanded","false"),e.removeClass("open").trigger(a.Event("hidden.bs.dropdown",f)))))}))}function d(b){return this.each(function(){var c=a(this),d=c.data("bs.dropdown");d||c.data("bs.dropdown",d=new g(this)),"string"==typeof b&&d[b].call(c)})}var e=".dropdown-backdrop",f='[data-toggle="dropdown"]',g=function(b){a(b).on("click.bs.dropdown",this.toggle)};g.VERSION="3.3.7",g.prototype.toggle=function(d){var e=a(this);if(!e.is(".disabled, :disabled")){var f=b(e),g=f.hasClass("open");if(c(),!g){"ontouchstart"in document.documentElement&&!f.closest(".navbar-nav").length&&a(document.createElement("div")).addClass("dropdown-backdrop").insertAfter(a(this)).on("click",c);var h={relatedTarget:this};if(f.trigger(d=a.Event("show.bs.dropdown",h)),d.isDefaultPrevented())return;e.trigger("focus").attr("aria-expanded","true"),f.toggleClass("open").trigger(a.Event("shown.bs.dropdown",h))}return!1}},g.prototype.keydown=function(c){if(/(38|40|27|32)/.test(c.which)&&!/input|textarea/i.test(c.target.tagName)){var d=a(this);if(c.preventDefault(),c.stopPropagation(),!d.is(".disabled, :disabled")){var e=b(d),g=e.hasClass("open");if(!g&&27!=c.which||g&&27==c.which)return 27==c.which&&e.find(f).trigger("focus"),d.trigger("click");var h=" li:not(.disabled):visible a",i=e.find(".dropdown-menu"+h);if(i.length){var j=i.index(c.target);38==c.which&&j>0&&j--,40==c.which&&j<i.length-1&&j++,~j||(j=0),i.eq(j).trigger("focus")}}}};var h=a.fn.dropdown;a.fn.dropdown=d,a.fn.dropdown.Constructor=g,a.fn.dropdown.noConflict=function(){return a.fn.dropdown=h,this},a(document).on("click.bs.dropdown.data-api",c).on("click.bs.dropdown.data-api",".dropdown form",function(a){a.stopPropagation()}).on("click.bs.dropdown.data-api",f,g.prototype.toggle).on("keydown.bs.dropdown.data-api",f,g.prototype.keydown).on("keydown.bs.dropdown.data-api",".dropdown-menu",g.prototype.keydown)}(jQuery),+function(a){"use strict";function b(b,d){return this.each(function(){var e=a(this),f=e.data("bs.modal"),g=a.extend({},c.DEFAULTS,e.data(),"object"==typeof b&&b);f||e.data("bs.modal",f=new c(this,g)),"string"==typeof b?f[b](d):g.show&&f.show(d)})}var c=function(b,c){this.options=c,this.$body=a(document.body),this.$element=a(b),this.$dialog=this.$element.find(".modal-dialog"),this.$backdrop=null,this.isShown=null,this.originalBodyPad=null,this.scrollbarWidth=0,this.ignoreBackdropClick=!1,this.options.remote&&this.$element.find(".modal-content").load(this.options.remote,a.proxy(function(){this.$element.trigger("loaded.bs.modal")},this))};c.VERSION="3.3.7",c.TRANSITION_DURATION=300,c.BACKDROP_TRANSITION_DURATION=150,c.DEFAULTS={backdrop:!0,keyboard:!0,show:!0},c.prototype.toggle=function(a){return this.isShown?this.hide():this.show(a)},c.prototype.show=function(b){var d=this,e=a.Event("show.bs.modal",{relatedTarget:b});this.$element.trigger(e),this.isShown||e.isDefaultPrevented()||(this.isShown=!0,this.checkScrollbar(),this.setScrollbar(),this.$body.addClass("modal-open"),this.escape(),this.resize(),this.$element.on("click.dismiss.bs.modal",'[data-dismiss="modal"]',a.proxy(this.hide,this)),this.$dialog.on("mousedown.dismiss.bs.modal",function(){d.$element.one("mouseup.dismiss.bs.modal",function(b){a(b.target).is(d.$element)&&(d.ignoreBackdropClick=!0)})}),this.backdrop(function(){var e=a.support.transition&&d.$element.hasClass("fade");d.$element.parent().length||d.$element.appendTo(d.$body),d.$element.show().scrollTop(0),d.adjustDialog(),e&&d.$element[0].offsetWidth,d.$element.addClass("in"),d.enforceFocus();var f=a.Event("shown.bs.modal",{relatedTarget:b});e?d.$dialog.one("bsTransitionEnd",function(){d.$element.trigger("focus").trigger(f)}).emulateTransitionEnd(c.TRANSITION_DURATION):d.$element.trigger("focus").trigger(f)}))},c.prototype.hide=function(b){b&&b.preventDefault(),b=a.Event("hide.bs.modal"),this.$element.trigger(b),this.isShown&&!b.isDefaultPrevented()&&(this.isShown=!1,this.escape(),this.resize(),a(document).off("focusin.bs.modal"),this.$element.removeClass("in").off("click.dismiss.bs.modal").off("mouseup.dismiss.bs.modal"),this.$dialog.off("mousedown.dismiss.bs.modal"),a.support.transition&&this.$element.hasClass("fade")?this.$element.one("bsTransitionEnd",a.proxy(this.hideModal,this)).emulateTransitionEnd(c.TRANSITION_DURATION):this.hideModal())},c.prototype.enforceFocus=function(){a(document).off("focusin.bs.modal").on("focusin.bs.modal",a.proxy(function(a){document===a.target||this.$element[0]===a.target||this.$element.has(a.target).length||this.$element.trigger("focus")},this))},c.prototype.escape=function(){this.isShown&&this.options.keyboard?this.$element.on("keydown.dismiss.bs.modal",a.proxy(function(a){27==a.which&&this.hide()},this)):this.isShown||this.$element.off("keydown.dismiss.bs.modal")},c.prototype.resize=function(){this.isShown?a(window).on("resize.bs.modal",a.proxy(this.handleUpdate,this)):a(window).off("resize.bs.modal")},c.prototype.hideModal=function(){var a=this;this.$element.hide(),this.backdrop(function(){a.$body.removeClass("modal-open"),a.resetAdjustments(),a.resetScrollbar(),a.$element.trigger("hidden.bs.modal")})},c.prototype.removeBackdrop=function(){this.$backdrop&&this.$backdrop.remove(),this.$backdrop=null},c.prototype.backdrop=function(b){var d=this,e=this.$element.hasClass("fade")?"fade":"";if(this.isShown&&this.options.backdrop){var f=a.support.transition&&e;if(this.$backdrop=a(document.createElement("div")).addClass("modal-backdrop "+e).appendTo(this.$body),this.$element.on("click.dismiss.bs.modal",a.proxy(function(a){return this.ignoreBackdropClick?void(this.ignoreBackdropClick=!1):void(a.target===a.currentTarget&&("static"==this.options.backdrop?this.$element[0].focus():this.hide()))},this)),f&&this.$backdrop[0].offsetWidth,this.$backdrop.addClass("in"),!b)return;f?this.$backdrop.one("bsTransitionEnd",b).emulateTransitionEnd(c.BACKDROP_TRANSITION_DURATION):b()}else if(!this.isShown&&this.$backdrop){this.$backdrop.removeClass("in");var g=function(){d.removeBackdrop(),b&&b()};a.support.transition&&this.$element.hasClass("fade")?this.$backdrop.one("bsTransitionEnd",g).emulateTransitionEnd(c.BACKDROP_TRANSITION_DURATION):g()}else b&&b()},c.prototype.handleUpdate=function(){this.adjustDialog()},c.prototype.adjustDialog=function(){var a=this.$element[0].scrollHeight>document.documentElement.clientHeight;this.$element.css({paddingLeft:!this.bodyIsOverflowing&&a?this.scrollbarWidth:"",paddingRight:this.bodyIsOverflowing&&!a?this.scrollbarWidth:""})},c.prototype.resetAdjustments=function(){this.$element.css({paddingLeft:"",paddingRight:""})},c.prototype.checkScrollbar=function(){var a=window.innerWidth;if(!a){var b=document.documentElement.getBoundingClientRect();a=b.right-Math.abs(b.left)}this.bodyIsOverflowing=document.body.clientWidth<a,this.scrollbarWidth=this.measureScrollbar()},c.prototype.setScrollbar=function(){var a=parseInt(this.$body.css("padding-right")||0,10);this.originalBodyPad=document.body.style.paddingRight||"",this.bodyIsOverflowing&&this.$body.css("padding-right",a+this.scrollbarWidth)},c.prototype.resetScrollbar=function(){this.$body.css("padding-right",this.originalBodyPad)},c.prototype.measureScrollbar=function(){var a=document.createElement("div");a.className="modal-scrollbar-measure",this.$body.append(a);var b=a.offsetWidth-a.clientWidth;return this.$body[0].removeChild(a),b};var d=a.fn.modal;a.fn.modal=b,a.fn.modal.Constructor=c,a.fn.modal.noConflict=function(){return a.fn.modal=d,this},a(document).on("click.bs.modal.data-api",'[data-toggle="modal"]',function(c){var d=a(this),e=d.attr("href"),f=a(d.attr("data-target")||e&&e.replace(/.*(?=#[^\s]+$)/,"")),g=f.data("bs.modal")?"toggle":a.extend({remote:!/#/.test(e)&&e},f.data(),d.data());d.is("a")&&c.preventDefault(),f.one("show.bs.modal",function(a){a.isDefaultPrevented()||f.one("hidden.bs.modal",function(){d.is(":visible")&&d.trigger("focus")})}),b.call(f,g,this)})}(jQuery),+function(a){"use strict";function b(b){return this.each(function(){var d=a(this),e=d.data("bs.tooltip"),f="object"==typeof b&&b;!e&&/destroy|hide/.test(b)||(e||d.data("bs.tooltip",e=new c(this,f)),"string"==typeof b&&e[b]())})}var c=function(a,b){this.type=null,this.options=null,this.enabled=null,this.timeout=null,this.hoverState=null,this.$element=null,this.inState=null,this.init("tooltip",a,b)};c.VERSION="3.3.7",c.TRANSITION_DURATION=150,c.DEFAULTS={animation:!0,placement:"top",selector:!1,template:'<div class="tooltip" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>',trigger:"hover focus",title:"",delay:0,html:!1,container:!1,viewport:{selector:"body",padding:0}},c.prototype.init=function(b,c,d){if(this.enabled=!0,this.type=b,this.$element=a(c),this.options=this.getOptions(d),this.$viewport=this.options.viewport&&a(a.isFunction(this.options.viewport)?this.options.viewport.call(this,this.$element):this.options.viewport.selector||this.options.viewport),this.inState={click:!1,hover:!1,focus:!1},this.$element[0]instanceof document.constructor&&!this.options.selector)throw new Error("`selector` option must be specified when initializing "+this.type+" on the window.document object!");for(var e=this.options.trigger.split(" "),f=e.length;f--;){var g=e[f];if("click"==g)this.$element.on("click."+this.type,this.options.selector,a.proxy(this.toggle,this));else if("manual"!=g){var h="hover"==g?"mouseenter":"focusin",i="hover"==g?"mouseleave":"focusout";this.$element.on(h+"."+this.type,this.options.selector,a.proxy(this.enter,this)),this.$element.on(i+"."+this.type,this.options.selector,a.proxy(this.leave,this))}}this.options.selector?this._options=a.extend({},this.options,{trigger:"manual",selector:""}):this.fixTitle()},c.prototype.getDefaults=function(){return c.DEFAULTS},c.prototype.getOptions=function(b){return b=a.extend({},this.getDefaults(),this.$element.data(),b),b.delay&&"number"==typeof b.delay&&(b.delay={show:b.delay,hide:b.delay}),b},c.prototype.getDelegateOptions=function(){var b={},c=this.getDefaults();return this._options&&a.each(this._options,function(a,d){c[a]!=d&&(b[a]=d)}),b},c.prototype.enter=function(b){var c=b instanceof this.constructor?b:a(b.currentTarget).data("bs."+this.type);return c||(c=new this.constructor(b.currentTarget,this.getDelegateOptions()),a(b.currentTarget).data("bs."+this.type,c)),b instanceof a.Event&&(c.inState["focusin"==b.type?"focus":"hover"]=!0),c.tip().hasClass("in")||"in"==c.hoverState?void(c.hoverState="in"):(clearTimeout(c.timeout),c.hoverState="in",c.options.delay&&c.options.delay.show?void(c.timeout=setTimeout(function(){"in"==c.hoverState&&c.show()},c.options.delay.show)):c.show())},c.prototype.isInStateTrue=function(){for(var a in this.inState)if(this.inState[a])return!0;return!1},c.prototype.leave=function(b){var c=b instanceof this.constructor?b:a(b.currentTarget).data("bs."+this.type);if(c||(c=new this.constructor(b.currentTarget,this.getDelegateOptions()),a(b.currentTarget).data("bs."+this.type,c)),b instanceof a.Event&&(c.inState["focusout"==b.type?"focus":"hover"]=!1),!c.isInStateTrue())return clearTimeout(c.timeout),c.hoverState="out",c.options.delay&&c.options.delay.hide?void(c.timeout=setTimeout(function(){"out"==c.hoverState&&c.hide()},c.options.delay.hide)):c.hide()},c.prototype.show=function(){var b=a.Event("show.bs."+this.type);if(this.hasContent()&&this.enabled){this.$element.trigger(b);var d=a.contains(this.$element[0].ownerDocument.documentElement,this.$element[0]);if(b.isDefaultPrevented()||!d)return;var e=this,f=this.tip(),g=this.getUID(this.type);this.setContent(),f.attr("id",g),this.$element.attr("aria-describedby",g),this.options.animation&&f.addClass("fade");var h="function"==typeof this.options.placement?this.options.placement.call(this,f[0],this.$element[0]):this.options.placement,i=/\s?auto?\s?/i,j=i.test(h);j&&(h=h.replace(i,"")||"top"),f.detach().css({top:0,left:0,display:"block"}).addClass(h).data("bs."+this.type,this),this.options.container?f.appendTo(this.options.container):f.insertAfter(this.$element),this.$element.trigger("inserted.bs."+this.type);var k=this.getPosition(),l=f[0].offsetWidth,m=f[0].offsetHeight;if(j){var n=h,o=this.getPosition(this.$viewport);h="bottom"==h&&k.bottom+m>o.bottom?"top":"top"==h&&k.top-m<o.top?"bottom":"right"==h&&k.right+l>o.width?"left":"left"==h&&k.left-l<o.left?"right":h,f.removeClass(n).addClass(h)}var p=this.getCalculatedOffset(h,k,l,m);this.applyPlacement(p,h);var q=function(){var a=e.hoverState;e.$element.trigger("shown.bs."+e.type),e.hoverState=null,"out"==a&&e.leave(e)};a.support.transition&&this.$tip.hasClass("fade")?f.one("bsTransitionEnd",q).emulateTransitionEnd(c.TRANSITION_DURATION):q()}},c.prototype.applyPlacement=function(b,c){var d=this.tip(),e=d[0].offsetWidth,f=d[0].offsetHeight,g=parseInt(d.css("margin-top"),10),h=parseInt(d.css("margin-left"),10);isNaN(g)&&(g=0),isNaN(h)&&(h=0),b.top+=g,b.left+=h,a.offset.setOffset(d[0],a.extend({using:function(a){d.css({top:Math.round(a.top),left:Math.round(a.left)})}},b),0),d.addClass("in");var i=d[0].offsetWidth,j=d[0].offsetHeight;"top"==c&&j!=f&&(b.top=b.top+f-j);var k=this.getViewportAdjustedDelta(c,b,i,j);k.left?b.left+=k.left:b.top+=k.top;var l=/top|bottom/.test(c),m=l?2*k.left-e+i:2*k.top-f+j,n=l?"offsetWidth":"offsetHeight";d.offset(b),this.replaceArrow(m,d[0][n],l)},c.prototype.replaceArrow=function(a,b,c){this.arrow().css(c?"left":"top",50*(1-a/b)+"%").css(c?"top":"left","")},c.prototype.setContent=function(){var a=this.tip(),b=this.getTitle();a.find(".tooltip-inner")[this.options.html?"html":"text"](b),a.removeClass("fade in top bottom left right")},c.prototype.hide=function(b){function d(){"in"!=e.hoverState&&f.detach(),e.$element&&e.$element.removeAttr("aria-describedby").trigger("hidden.bs."+e.type),b&&b()}var e=this,f=a(this.$tip),g=a.Event("hide.bs."+this.type);if(this.$element.trigger(g),!g.isDefaultPrevented())return f.removeClass("in"),a.support.transition&&f.hasClass("fade")?f.one("bsTransitionEnd",d).emulateTransitionEnd(c.TRANSITION_DURATION):d(),this.hoverState=null,this},c.prototype.fixTitle=function(){var a=this.$element;(a.attr("title")||"string"!=typeof a.attr("data-original-title"))&&a.attr("data-original-title",a.attr("title")||"").attr("title","")},c.prototype.hasContent=function(){return this.getTitle()},c.prototype.getPosition=function(b){b=b||this.$element;var c=b[0],d="BODY"==c.tagName,e=c.getBoundingClientRect();null==e.width&&(e=a.extend({},e,{width:e.right-e.left,height:e.bottom-e.top}));var f=window.SVGElement&&c instanceof window.SVGElement,g=d?{top:0,left:0}:f?null:b.offset(),h={scroll:d?document.documentElement.scrollTop||document.body.scrollTop:b.scrollTop()},i=d?{width:a(window).width(),height:a(window).height()}:null;return a.extend({},e,h,i,g)},c.prototype.getCalculatedOffset=function(a,b,c,d){return"bottom"==a?{top:b.top+b.height,left:b.left+b.width/2-c/2}:"top"==a?{top:b.top-d,left:b.left+b.width/2-c/2}:"left"==a?{top:b.top+b.height/2-d/2,left:b.left-c}:{top:b.top+b.height/2-d/2,left:b.left+b.width}},c.prototype.getViewportAdjustedDelta=function(a,b,c,d){var e={top:0,left:0};if(!this.$viewport)return e;var f=this.options.viewport&&this.options.viewport.padding||0,g=this.getPosition(this.$viewport);if(/right|left/.test(a)){var h=b.top-f-g.scroll,i=b.top+f-g.scroll+d;h<g.top?e.top=g.top-h:i>g.top+g.height&&(e.top=g.top+g.height-i)}else{var j=b.left-f,k=b.left+f+c;j<g.left?e.left=g.left-j:k>g.right&&(e.left=g.left+g.width-k)}return e},c.prototype.getTitle=function(){var a,b=this.$element,c=this.options;return a=b.attr("data-original-title")||("function"==typeof c.title?c.title.call(b[0]):c.title)},c.prototype.getUID=function(a){do a+=~~(1e6*Math.random());while(document.getElementById(a));return a},c.prototype.tip=function(){if(!this.$tip&&(this.$tip=a(this.options.template),1!=this.$tip.length))throw new Error(this.type+" `template` option must consist of exactly 1 top-level element!");return this.$tip},c.prototype.arrow=function(){return this.$arrow=this.$arrow||this.tip().find(".tooltip-arrow")},c.prototype.enable=function(){this.enabled=!0},c.prototype.disable=function(){this.enabled=!1},c.prototype.toggleEnabled=function(){this.enabled=!this.enabled},c.prototype.toggle=function(b){var c=this;b&&(c=a(b.currentTarget).data("bs."+this.type),c||(c=new this.constructor(b.currentTarget,this.getDelegateOptions()),a(b.currentTarget).data("bs."+this.type,c))),b?(c.inState.click=!c.inState.click,c.isInStateTrue()?c.enter(c):c.leave(c)):c.tip().hasClass("in")?c.leave(c):c.enter(c)},c.prototype.destroy=function(){var a=this;clearTimeout(this.timeout),this.hide(function(){a.$element.off("."+a.type).removeData("bs."+a.type),a.$tip&&a.$tip.detach(),a.$tip=null,a.$arrow=null,a.$viewport=null,a.$element=null})};var d=a.fn.tooltip;a.fn.tooltip=b,a.fn.tooltip.Constructor=c,a.fn.tooltip.noConflict=function(){return a.fn.tooltip=d,this}}(jQuery),+function(a){"use strict";function b(b){return this.each(function(){var d=a(this),e=d.data("bs.popover"),f="object"==typeof b&&b;!e&&/destroy|hide/.test(b)||(e||d.data("bs.popover",e=new c(this,f)),"string"==typeof b&&e[b]())})}var c=function(a,b){this.init("popover",a,b)};if(!a.fn.tooltip)throw new Error("Popover requires tooltip.js");c.VERSION="3.3.7",c.DEFAULTS=a.extend({},a.fn.tooltip.Constructor.DEFAULTS,{placement:"right",trigger:"click",content:"",template:'<div class="popover" role="tooltip"><div class="arrow"></div><h3 class="popover-title"></h3><div class="popover-content"></div></div>'}),c.prototype=a.extend({},a.fn.tooltip.Constructor.prototype),c.prototype.constructor=c,c.prototype.getDefaults=function(){return c.DEFAULTS},c.prototype.setContent=function(){var a=this.tip(),b=this.getTitle(),c=this.getContent();a.find(".popover-title")[this.options.html?"html":"text"](b),a.find(".popover-content").children().detach().end()[this.options.html?"string"==typeof c?"html":"append":"text"](c),a.removeClass("fade top bottom left right in"),a.find(".popover-title").html()||a.find(".popover-title").hide()},c.prototype.hasContent=function(){return this.getTitle()||this.getContent()},c.prototype.getContent=function(){var a=this.$element,b=this.options;return a.attr("data-content")||("function"==typeof b.content?b.content.call(a[0]):b.content)},c.prototype.arrow=function(){return this.$arrow=this.$arrow||this.tip().find(".arrow")};var d=a.fn.popover;a.fn.popover=b,a.fn.popover.Constructor=c,a.fn.popover.noConflict=function(){return a.fn.popover=d,this}}(jQuery),+function(a){"use strict";function b(c,d){this.$body=a(document.body),this.$scrollElement=a(a(c).is(document.body)?window:c),this.options=a.extend({},b.DEFAULTS,d),this.selector=(this.options.target||"")+" .nav li > a",this.offsets=[],this.targets=[],this.activeTarget=null,this.scrollHeight=0,this.$scrollElement.on("scroll.bs.scrollspy",a.proxy(this.process,this)),this.refresh(),this.process()}function c(c){return this.each(function(){var d=a(this),e=d.data("bs.scrollspy"),f="object"==typeof c&&c;e||d.data("bs.scrollspy",e=new b(this,f)),"string"==typeof c&&e[c]()})}b.VERSION="3.3.7",b.DEFAULTS={offset:10},b.prototype.getScrollHeight=function(){return this.$scrollElement[0].scrollHeight||Math.max(this.$body[0].scrollHeight,document.documentElement.scrollHeight)},b.prototype.refresh=function(){var b=this,c="offset",d=0;this.offsets=[],this.targets=[],this.scrollHeight=this.getScrollHeight(),a.isWindow(this.$scrollElement[0])||(c="position",d=this.$scrollElement.scrollTop()),this.$body.find(this.selector).map(function(){var b=a(this),e=b.data("target")||b.attr("href"),f=/^#./.test(e)&&a(e);return f&&f.length&&f.is(":visible")&&[[f[c]().top+d,e]]||null}).sort(function(a,b){return a[0]-b[0]}).each(function(){b.offsets.push(this[0]),b.targets.push(this[1])})},b.prototype.process=function(){var a,b=this.$scrollElement.scrollTop()+this.options.offset,c=this.getScrollHeight(),d=this.options.offset+c-this.$scrollElement.height(),e=this.offsets,f=this.targets,g=this.activeTarget;if(this.scrollHeight!=c&&this.refresh(),b>=d)return g!=(a=f[f.length-1])&&this.activate(a);if(g&&b<e[0])return this.activeTarget=null,this.clear();for(a=e.length;a--;)g!=f[a]&&b>=e[a]&&(void 0===e[a+1]||b<e[a+1])&&this.activate(f[a])},b.prototype.activate=function(b){
this.activeTarget=b,this.clear();var c=this.selector+'[data-target="'+b+'"],'+this.selector+'[href="'+b+'"]',d=a(c).parents("li").addClass("active");d.parent(".dropdown-menu").length&&(d=d.closest("li.dropdown").addClass("active")),d.trigger("activate.bs.scrollspy")},b.prototype.clear=function(){a(this.selector).parentsUntil(this.options.target,".active").removeClass("active")};var d=a.fn.scrollspy;a.fn.scrollspy=c,a.fn.scrollspy.Constructor=b,a.fn.scrollspy.noConflict=function(){return a.fn.scrollspy=d,this},a(window).on("load.bs.scrollspy.data-api",function(){a('[data-spy="scroll"]').each(function(){var b=a(this);c.call(b,b.data())})})}(jQuery),+function(a){"use strict";function b(b){return this.each(function(){var d=a(this),e=d.data("bs.tab");e||d.data("bs.tab",e=new c(this)),"string"==typeof b&&e[b]()})}var c=function(b){this.element=a(b)};c.VERSION="3.3.7",c.TRANSITION_DURATION=150,c.prototype.show=function(){var b=this.element,c=b.closest("ul:not(.dropdown-menu)"),d=b.data("target");if(d||(d=b.attr("href"),d=d&&d.replace(/.*(?=#[^\s]*$)/,"")),!b.parent("li").hasClass("active")){var e=c.find(".active:last a"),f=a.Event("hide.bs.tab",{relatedTarget:b[0]}),g=a.Event("show.bs.tab",{relatedTarget:e[0]});if(e.trigger(f),b.trigger(g),!g.isDefaultPrevented()&&!f.isDefaultPrevented()){var h=a(d);this.activate(b.closest("li"),c),this.activate(h,h.parent(),function(){e.trigger({type:"hidden.bs.tab",relatedTarget:b[0]}),b.trigger({type:"shown.bs.tab",relatedTarget:e[0]})})}}},c.prototype.activate=function(b,d,e){function f(){g.removeClass("active").find("> .dropdown-menu > .active").removeClass("active").end().find('[data-toggle="tab"]').attr("aria-expanded",!1),b.addClass("active").find('[data-toggle="tab"]').attr("aria-expanded",!0),h?(b[0].offsetWidth,b.addClass("in")):b.removeClass("fade"),b.parent(".dropdown-menu").length&&b.closest("li.dropdown").addClass("active").end().find('[data-toggle="tab"]').attr("aria-expanded",!0),e&&e()}var g=d.find("> .active"),h=e&&a.support.transition&&(g.length&&g.hasClass("fade")||!!d.find("> .fade").length);g.length&&h?g.one("bsTransitionEnd",f).emulateTransitionEnd(c.TRANSITION_DURATION):f(),g.removeClass("in")};var d=a.fn.tab;a.fn.tab=b,a.fn.tab.Constructor=c,a.fn.tab.noConflict=function(){return a.fn.tab=d,this};var e=function(c){c.preventDefault(),b.call(a(this),"show")};a(document).on("click.bs.tab.data-api",'[data-toggle="tab"]',e).on("click.bs.tab.data-api",'[data-toggle="pill"]',e)}(jQuery),+function(a){"use strict";function b(b){return this.each(function(){var d=a(this),e=d.data("bs.affix"),f="object"==typeof b&&b;e||d.data("bs.affix",e=new c(this,f)),"string"==typeof b&&e[b]()})}var c=function(b,d){this.options=a.extend({},c.DEFAULTS,d),this.$target=a(this.options.target).on("scroll.bs.affix.data-api",a.proxy(this.checkPosition,this)).on("click.bs.affix.data-api",a.proxy(this.checkPositionWithEventLoop,this)),this.$element=a(b),this.affixed=null,this.unpin=null,this.pinnedOffset=null,this.checkPosition()};c.VERSION="3.3.7",c.RESET="affix affix-top affix-bottom",c.DEFAULTS={offset:0,target:window},c.prototype.getState=function(a,b,c,d){var e=this.$target.scrollTop(),f=this.$element.offset(),g=this.$target.height();if(null!=c&&"top"==this.affixed)return e<c&&"top";if("bottom"==this.affixed)return null!=c?!(e+this.unpin<=f.top)&&"bottom":!(e+g<=a-d)&&"bottom";var h=null==this.affixed,i=h?e:f.top,j=h?g:b;return null!=c&&e<=c?"top":null!=d&&i+j>=a-d&&"bottom"},c.prototype.getPinnedOffset=function(){if(this.pinnedOffset)return this.pinnedOffset;this.$element.removeClass(c.RESET).addClass("affix");var a=this.$target.scrollTop(),b=this.$element.offset();return this.pinnedOffset=b.top-a},c.prototype.checkPositionWithEventLoop=function(){setTimeout(a.proxy(this.checkPosition,this),1)},c.prototype.checkPosition=function(){if(this.$element.is(":visible")){var b=this.$element.height(),d=this.options.offset,e=d.top,f=d.bottom,g=Math.max(a(document).height(),a(document.body).height());"object"!=typeof d&&(f=e=d),"function"==typeof e&&(e=d.top(this.$element)),"function"==typeof f&&(f=d.bottom(this.$element));var h=this.getState(g,b,e,f);if(this.affixed!=h){null!=this.unpin&&this.$element.css("top","");var i="affix"+(h?"-"+h:""),j=a.Event(i+".bs.affix");if(this.$element.trigger(j),j.isDefaultPrevented())return;this.affixed=h,this.unpin="bottom"==h?this.getPinnedOffset():null,this.$element.removeClass(c.RESET).addClass(i).trigger(i.replace("affix","affixed")+".bs.affix")}"bottom"==h&&this.$element.offset({top:g-b-f})}};var d=a.fn.affix;a.fn.affix=b,a.fn.affix.Constructor=c,a.fn.affix.noConflict=function(){return a.fn.affix=d,this},a(window).on("load",function(){a('[data-spy="affix"]').each(function(){var c=a(this),d=c.data();d.offset=d.offset||{},null!=d.offsetBottom&&(d.offset.bottom=d.offsetBottom),null!=d.offsetTop&&(d.offset.top=d.offsetTop),b.call(c,d)})})}(jQuery);;
/**
 * Owl Carousel v2.2.1
 * Copyright 2013-2017 David Deutsch
 * Licensed under  ()
 */
!function(a,b,c,d){function e(b,c){this.settings=null,this.options=a.extend({},e.Defaults,c),this.$element=a(b),this._handlers={},this._plugins={},this._supress={},this._current=null,this._speed=null,this._coordinates=[],this._breakpoint=null,this._width=null,this._items=[],this._clones=[],this._mergers=[],this._widths=[],this._invalidated={},this._pipe=[],this._drag={time:null,target:null,pointer:null,stage:{start:null,current:null},direction:null},this._states={current:{},tags:{initializing:["busy"],animating:["busy"],dragging:["interacting"]}},a.each(["onResize","onThrottledResize"],a.proxy(function(b,c){this._handlers[c]=a.proxy(this[c],this)},this)),a.each(e.Plugins,a.proxy(function(a,b){this._plugins[a.charAt(0).toLowerCase()+a.slice(1)]=new b(this)},this)),a.each(e.Workers,a.proxy(function(b,c){this._pipe.push({filter:c.filter,run:a.proxy(c.run,this)})},this)),this.setup(),this.initialize()}e.Defaults={items:3,loop:!1,center:!1,rewind:!1,mouseDrag:!0,touchDrag:!0,pullDrag:!0,freeDrag:!1,margin:0,stagePadding:0,merge:!1,mergeFit:!0,autoWidth:!1,startPosition:0,rtl:!1,smartSpeed:250,fluidSpeed:!1,dragEndSpeed:!1,responsive:{},responsiveRefreshRate:200,responsiveBaseElement:b,fallbackEasing:"swing",info:!1,nestedItemSelector:!1,itemElement:"div",stageElement:"div",refreshClass:"owl-refresh",loadedClass:"owl-loaded",loadingClass:"owl-loading",rtlClass:"owl-rtl",responsiveClass:"owl-responsive",dragClass:"owl-drag",itemClass:"owl-item",stageClass:"owl-stage",stageOuterClass:"owl-stage-outer",grabClass:"owl-grab"},e.Width={Default:"default",Inner:"inner",Outer:"outer"},e.Type={Event:"event",State:"state"},e.Plugins={},e.Workers=[{filter:["width","settings"],run:function(){this._width=this.$element.width()}},{filter:["width","items","settings"],run:function(a){a.current=this._items&&this._items[this.relative(this._current)]}},{filter:["items","settings"],run:function(){this.$stage.children(".cloned").remove()}},{filter:["width","items","settings"],run:function(a){var b=this.settings.margin||"",c=!this.settings.autoWidth,d=this.settings.rtl,e={width:"auto","margin-left":d?b:"","margin-right":d?"":b};!c&&this.$stage.children().css(e),a.css=e}},{filter:["width","items","settings"],run:function(a){var b=(this.width()/this.settings.items).toFixed(3)-this.settings.margin,c=null,d=this._items.length,e=!this.settings.autoWidth,f=[];for(a.items={merge:!1,width:b};d--;)c=this._mergers[d],c=this.settings.mergeFit&&Math.min(c,this.settings.items)||c,a.items.merge=c>1||a.items.merge,f[d]=e?b*c:this._items[d].width();this._widths=f}},{filter:["items","settings"],run:function(){var b=[],c=this._items,d=this.settings,e=Math.max(2*d.items,4),f=2*Math.ceil(c.length/2),g=d.loop&&c.length?d.rewind?e:Math.max(e,f):0,h="",i="";for(g/=2;g--;)b.push(this.normalize(b.length/2,!0)),h+=c[b[b.length-1]][0].outerHTML,b.push(this.normalize(c.length-1-(b.length-1)/2,!0)),i=c[b[b.length-1]][0].outerHTML+i;this._clones=b,a(h).addClass("cloned").appendTo(this.$stage),a(i).addClass("cloned").prependTo(this.$stage)}},{filter:["width","items","settings"],run:function(){for(var a=this.settings.rtl?1:-1,b=this._clones.length+this._items.length,c=-1,d=0,e=0,f=[];++c<b;)d=f[c-1]||0,e=this._widths[this.relative(c)]+this.settings.margin,f.push(d+e*a);this._coordinates=f}},{filter:["width","items","settings"],run:function(){var a=this.settings.stagePadding,b=this._coordinates,c={width:Math.ceil(Math.abs(b[b.length-1]))+2*a,"padding-left":a||"","padding-right":a||""};this.$stage.css(c)}},{filter:["width","items","settings"],run:function(a){var b=this._coordinates.length,c=!this.settings.autoWidth,d=this.$stage.children();if(c&&a.items.merge)for(;b--;)a.css.width=this._widths[this.relative(b)],d.eq(b).css(a.css);else c&&(a.css.width=a.items.width,d.css(a.css))}},{filter:["items"],run:function(){this._coordinates.length<1&&this.$stage.removeAttr("style")}},{filter:["width","items","settings"],run:function(a){a.current=a.current?this.$stage.children().index(a.current):0,a.current=Math.max(this.minimum(),Math.min(this.maximum(),a.current)),this.reset(a.current)}},{filter:["position"],run:function(){this.animate(this.coordinates(this._current))}},{filter:["width","position","items","settings"],run:function(){var a,b,c,d,e=this.settings.rtl?1:-1,f=2*this.settings.stagePadding,g=this.coordinates(this.current())+f,h=g+this.width()*e,i=[];for(c=0,d=this._coordinates.length;c<d;c++)a=this._coordinates[c-1]||0,b=Math.abs(this._coordinates[c])+f*e,(this.op(a,"<=",g)&&this.op(a,">",h)||this.op(b,"<",g)&&this.op(b,">",h))&&i.push(c);this.$stage.children(".active").removeClass("active"),this.$stage.children(":eq("+i.join("), :eq(")+")").addClass("active"),this.settings.center&&(this.$stage.children(".center").removeClass("center"),this.$stage.children().eq(this.current()).addClass("center"))}}],e.prototype.initialize=function(){if(this.enter("initializing"),this.trigger("initialize"),this.$element.toggleClass(this.settings.rtlClass,this.settings.rtl),this.settings.autoWidth&&!this.is("pre-loading")){var b,c,e;b=this.$element.find("img"),c=this.settings.nestedItemSelector?"."+this.settings.nestedItemSelector:d,e=this.$element.children(c).width(),b.length&&e<=0&&this.preloadAutoWidthImages(b)}this.$element.addClass(this.options.loadingClass),this.$stage=a("<"+this.settings.stageElement+' class="'+this.settings.stageClass+'"/>').wrap('<div class="'+this.settings.stageOuterClass+'"/>'),this.$element.append(this.$stage.parent()),this.replace(this.$element.children().not(this.$stage.parent())),this.$element.is(":visible")?this.refresh():this.invalidate("width"),this.$element.removeClass(this.options.loadingClass).addClass(this.options.loadedClass),this.registerEventHandlers(),this.leave("initializing"),this.trigger("initialized")},e.prototype.setup=function(){var b=this.viewport(),c=this.options.responsive,d=-1,e=null;c?(a.each(c,function(a){a<=b&&a>d&&(d=Number(a))}),e=a.extend({},this.options,c[d]),"function"==typeof e.stagePadding&&(e.stagePadding=e.stagePadding()),delete e.responsive,e.responsiveClass&&this.$element.attr("class",this.$element.attr("class").replace(new RegExp("("+this.options.responsiveClass+"-)\\S+\\s","g"),"$1"+d))):e=a.extend({},this.options),this.trigger("change",{property:{name:"settings",value:e}}),this._breakpoint=d,this.settings=e,this.invalidate("settings"),this.trigger("changed",{property:{name:"settings",value:this.settings}})},e.prototype.optionsLogic=function(){this.settings.autoWidth&&(this.settings.stagePadding=!1,this.settings.merge=!1)},e.prototype.prepare=function(b){var c=this.trigger("prepare",{content:b});return c.data||(c.data=a("<"+this.settings.itemElement+"/>").addClass(this.options.itemClass).append(b)),this.trigger("prepared",{content:c.data}),c.data},e.prototype.update=function(){for(var b=0,c=this._pipe.length,d=a.proxy(function(a){return this[a]},this._invalidated),e={};b<c;)(this._invalidated.all||a.grep(this._pipe[b].filter,d).length>0)&&this._pipe[b].run(e),b++;this._invalidated={},!this.is("valid")&&this.enter("valid")},e.prototype.width=function(a){switch(a=a||e.Width.Default){case e.Width.Inner:case e.Width.Outer:return this._width;default:return this._width-2*this.settings.stagePadding+this.settings.margin}},e.prototype.refresh=function(){this.enter("refreshing"),this.trigger("refresh"),this.setup(),this.optionsLogic(),this.$element.addClass(this.options.refreshClass),this.update(),this.$element.removeClass(this.options.refreshClass),this.leave("refreshing"),this.trigger("refreshed")},e.prototype.onThrottledResize=function(){b.clearTimeout(this.resizeTimer),this.resizeTimer=b.setTimeout(this._handlers.onResize,this.settings.responsiveRefreshRate)},e.prototype.onResize=function(){return!!this._items.length&&(this._width!==this.$element.width()&&(!!this.$element.is(":visible")&&(this.enter("resizing"),this.trigger("resize").isDefaultPrevented()?(this.leave("resizing"),!1):(this.invalidate("width"),this.refresh(),this.leave("resizing"),void this.trigger("resized")))))},e.prototype.registerEventHandlers=function(){a.support.transition&&this.$stage.on(a.support.transition.end+".owl.core",a.proxy(this.onTransitionEnd,this)),this.settings.responsive!==!1&&this.on(b,"resize",this._handlers.onThrottledResize),this.settings.mouseDrag&&(this.$element.addClass(this.options.dragClass),this.$stage.on("mousedown.owl.core",a.proxy(this.onDragStart,this)),this.$stage.on("dragstart.owl.core selectstart.owl.core",function(){return!1})),this.settings.touchDrag&&(this.$stage.on("touchstart.owl.core",a.proxy(this.onDragStart,this)),this.$stage.on("touchcancel.owl.core",a.proxy(this.onDragEnd,this)))},e.prototype.onDragStart=function(b){var d=null;3!==b.which&&(a.support.transform?(d=this.$stage.css("transform").replace(/.*\(|\)| /g,"").split(","),d={x:d[16===d.length?12:4],y:d[16===d.length?13:5]}):(d=this.$stage.position(),d={x:this.settings.rtl?d.left+this.$stage.width()-this.width()+this.settings.margin:d.left,y:d.top}),this.is("animating")&&(a.support.transform?this.animate(d.x):this.$stage.stop(),this.invalidate("position")),this.$element.toggleClass(this.options.grabClass,"mousedown"===b.type),this.speed(0),this._drag.time=(new Date).getTime(),this._drag.target=a(b.target),this._drag.stage.start=d,this._drag.stage.current=d,this._drag.pointer=this.pointer(b),a(c).on("mouseup.owl.core touchend.owl.core",a.proxy(this.onDragEnd,this)),a(c).one("mousemove.owl.core touchmove.owl.core",a.proxy(function(b){var d=this.difference(this._drag.pointer,this.pointer(b));a(c).on("mousemove.owl.core touchmove.owl.core",a.proxy(this.onDragMove,this)),Math.abs(d.x)<Math.abs(d.y)&&this.is("valid")||(b.preventDefault(),this.enter("dragging"),this.trigger("drag"))},this)))},e.prototype.onDragMove=function(a){var b=null,c=null,d=null,e=this.difference(this._drag.pointer,this.pointer(a)),f=this.difference(this._drag.stage.start,e);this.is("dragging")&&(a.preventDefault(),this.settings.loop?(b=this.coordinates(this.minimum()),c=this.coordinates(this.maximum()+1)-b,f.x=((f.x-b)%c+c)%c+b):(b=this.settings.rtl?this.coordinates(this.maximum()):this.coordinates(this.minimum()),c=this.settings.rtl?this.coordinates(this.minimum()):this.coordinates(this.maximum()),d=this.settings.pullDrag?-1*e.x/5:0,f.x=Math.max(Math.min(f.x,b+d),c+d)),this._drag.stage.current=f,this.animate(f.x))},e.prototype.onDragEnd=function(b){var d=this.difference(this._drag.pointer,this.pointer(b)),e=this._drag.stage.current,f=d.x>0^this.settings.rtl?"left":"right";a(c).off(".owl.core"),this.$element.removeClass(this.options.grabClass),(0!==d.x&&this.is("dragging")||!this.is("valid"))&&(this.speed(this.settings.dragEndSpeed||this.settings.smartSpeed),this.current(this.closest(e.x,0!==d.x?f:this._drag.direction)),this.invalidate("position"),this.update(),this._drag.direction=f,(Math.abs(d.x)>3||(new Date).getTime()-this._drag.time>300)&&this._drag.target.one("click.owl.core",function(){return!1})),this.is("dragging")&&(this.leave("dragging"),this.trigger("dragged"))},e.prototype.closest=function(b,c){var d=-1,e=30,f=this.width(),g=this.coordinates();return this.settings.freeDrag||a.each(g,a.proxy(function(a,h){return"left"===c&&b>h-e&&b<h+e?d=a:"right"===c&&b>h-f-e&&b<h-f+e?d=a+1:this.op(b,"<",h)&&this.op(b,">",g[a+1]||h-f)&&(d="left"===c?a+1:a),d===-1},this)),this.settings.loop||(this.op(b,">",g[this.minimum()])?d=b=this.minimum():this.op(b,"<",g[this.maximum()])&&(d=b=this.maximum())),d},e.prototype.animate=function(b){var c=this.speed()>0;this.is("animating")&&this.onTransitionEnd(),c&&(this.enter("animating"),this.trigger("translate")),a.support.transform3d&&a.support.transition?this.$stage.css({transform:"translate3d("+b+"px,0px,0px)",transition:this.speed()/1e3+"s"}):c?this.$stage.animate({left:b+"px"},this.speed(),this.settings.fallbackEasing,a.proxy(this.onTransitionEnd,this)):this.$stage.css({left:b+"px"})},e.prototype.is=function(a){return this._states.current[a]&&this._states.current[a]>0},e.prototype.current=function(a){if(a===d)return this._current;if(0===this._items.length)return d;if(a=this.normalize(a),this._current!==a){var b=this.trigger("change",{property:{name:"position",value:a}});b.data!==d&&(a=this.normalize(b.data)),this._current=a,this.invalidate("position"),this.trigger("changed",{property:{name:"position",value:this._current}})}return this._current},e.prototype.invalidate=function(b){return"string"===a.type(b)&&(this._invalidated[b]=!0,this.is("valid")&&this.leave("valid")),a.map(this._invalidated,function(a,b){return b})},e.prototype.reset=function(a){a=this.normalize(a),a!==d&&(this._speed=0,this._current=a,this.suppress(["translate","translated"]),this.animate(this.coordinates(a)),this.release(["translate","translated"]))},e.prototype.normalize=function(a,b){var c=this._items.length,e=b?0:this._clones.length;return!this.isNumeric(a)||c<1?a=d:(a<0||a>=c+e)&&(a=((a-e/2)%c+c)%c+e/2),a},e.prototype.relative=function(a){return a-=this._clones.length/2,this.normalize(a,!0)},e.prototype.maximum=function(a){var b,c,d,e=this.settings,f=this._coordinates.length;if(e.loop)f=this._clones.length/2+this._items.length-1;else if(e.autoWidth||e.merge){for(b=this._items.length,c=this._items[--b].width(),d=this.$element.width();b--&&(c+=this._items[b].width()+this.settings.margin,!(c>d)););f=b+1}else f=e.center?this._items.length-1:this._items.length-e.items;return a&&(f-=this._clones.length/2),Math.max(f,0)},e.prototype.minimum=function(a){return a?0:this._clones.length/2},e.prototype.items=function(a){return a===d?this._items.slice():(a=this.normalize(a,!0),this._items[a])},e.prototype.mergers=function(a){return a===d?this._mergers.slice():(a=this.normalize(a,!0),this._mergers[a])},e.prototype.clones=function(b){var c=this._clones.length/2,e=c+this._items.length,f=function(a){return a%2===0?e+a/2:c-(a+1)/2};return b===d?a.map(this._clones,function(a,b){return f(b)}):a.map(this._clones,function(a,c){return a===b?f(c):null})},e.prototype.speed=function(a){return a!==d&&(this._speed=a),this._speed},e.prototype.coordinates=function(b){var c,e=1,f=b-1;return b===d?a.map(this._coordinates,a.proxy(function(a,b){return this.coordinates(b)},this)):(this.settings.center?(this.settings.rtl&&(e=-1,f=b+1),c=this._coordinates[b],c+=(this.width()-c+(this._coordinates[f]||0))/2*e):c=this._coordinates[f]||0,c=Math.ceil(c))},e.prototype.duration=function(a,b,c){return 0===c?0:Math.min(Math.max(Math.abs(b-a),1),6)*Math.abs(c||this.settings.smartSpeed)},e.prototype.to=function(a,b){var c=this.current(),d=null,e=a-this.relative(c),f=(e>0)-(e<0),g=this._items.length,h=this.minimum(),i=this.maximum();this.settings.loop?(!this.settings.rewind&&Math.abs(e)>g/2&&(e+=f*-1*g),a=c+e,d=((a-h)%g+g)%g+h,d!==a&&d-e<=i&&d-e>0&&(c=d-e,a=d,this.reset(c))):this.settings.rewind?(i+=1,a=(a%i+i)%i):a=Math.max(h,Math.min(i,a)),this.speed(this.duration(c,a,b)),this.current(a),this.$element.is(":visible")&&this.update()},e.prototype.next=function(a){a=a||!1,this.to(this.relative(this.current())+1,a)},e.prototype.prev=function(a){a=a||!1,this.to(this.relative(this.current())-1,a)},e.prototype.onTransitionEnd=function(a){if(a!==d&&(a.stopPropagation(),(a.target||a.srcElement||a.originalTarget)!==this.$stage.get(0)))return!1;this.leave("animating"),this.trigger("translated")},e.prototype.viewport=function(){var d;return this.options.responsiveBaseElement!==b?d=a(this.options.responsiveBaseElement).width():b.innerWidth?d=b.innerWidth:c.documentElement&&c.documentElement.clientWidth?d=c.documentElement.clientWidth:console.warn("Can not detect viewport width."),d},e.prototype.replace=function(b){this.$stage.empty(),this._items=[],b&&(b=b instanceof jQuery?b:a(b)),this.settings.nestedItemSelector&&(b=b.find("."+this.settings.nestedItemSelector)),b.filter(function(){return 1===this.nodeType}).each(a.proxy(function(a,b){b=this.prepare(b),this.$stage.append(b),this._items.push(b),this._mergers.push(1*b.find("[data-merge]").addBack("[data-merge]").attr("data-merge")||1)},this)),this.reset(this.isNumeric(this.settings.startPosition)?this.settings.startPosition:0),this.invalidate("items")},e.prototype.add=function(b,c){var e=this.relative(this._current);c=c===d?this._items.length:this.normalize(c,!0),b=b instanceof jQuery?b:a(b),this.trigger("add",{content:b,position:c}),b=this.prepare(b),0===this._items.length||c===this._items.length?(0===this._items.length&&this.$stage.append(b),0!==this._items.length&&this._items[c-1].after(b),this._items.push(b),this._mergers.push(1*b.find("[data-merge]").addBack("[data-merge]").attr("data-merge")||1)):(this._items[c].before(b),this._items.splice(c,0,b),this._mergers.splice(c,0,1*b.find("[data-merge]").addBack("[data-merge]").attr("data-merge")||1)),this._items[e]&&this.reset(this._items[e].index()),this.invalidate("items"),this.trigger("added",{content:b,position:c})},e.prototype.remove=function(a){a=this.normalize(a,!0),a!==d&&(this.trigger("remove",{content:this._items[a],position:a}),this._items[a].remove(),this._items.splice(a,1),this._mergers.splice(a,1),this.invalidate("items"),this.trigger("removed",{content:null,position:a}))},e.prototype.preloadAutoWidthImages=function(b){b.each(a.proxy(function(b,c){this.enter("pre-loading"),c=a(c),a(new Image).one("load",a.proxy(function(a){c.attr("src",a.target.src),c.css("opacity",1),this.leave("pre-loading"),!this.is("pre-loading")&&!this.is("initializing")&&this.refresh()},this)).attr("src",c.attr("src")||c.attr("data-src")||c.attr("data-src-retina"))},this))},e.prototype.destroy=function(){this.$element.off(".owl.core"),this.$stage.off(".owl.core"),a(c).off(".owl.core"),this.settings.responsive!==!1&&(b.clearTimeout(this.resizeTimer),this.off(b,"resize",this._handlers.onThrottledResize));for(var d in this._plugins)this._plugins[d].destroy();this.$stage.children(".cloned").remove(),this.$stage.unwrap(),this.$stage.children().contents().unwrap(),this.$stage.children().unwrap(),this.$element.removeClass(this.options.refreshClass).removeClass(this.options.loadingClass).removeClass(this.options.loadedClass).removeClass(this.options.rtlClass).removeClass(this.options.dragClass).removeClass(this.options.grabClass).attr("class",this.$element.attr("class").replace(new RegExp(this.options.responsiveClass+"-\\S+\\s","g"),"")).removeData("owl.carousel")},e.prototype.op=function(a,b,c){var d=this.settings.rtl;switch(b){case"<":return d?a>c:a<c;case">":return d?a<c:a>c;case">=":return d?a<=c:a>=c;case"<=":return d?a>=c:a<=c}},e.prototype.on=function(a,b,c,d){a.addEventListener?a.addEventListener(b,c,d):a.attachEvent&&a.attachEvent("on"+b,c)},e.prototype.off=function(a,b,c,d){a.removeEventListener?a.removeEventListener(b,c,d):a.detachEvent&&a.detachEvent("on"+b,c)},e.prototype.trigger=function(b,c,d,f,g){var h={item:{count:this._items.length,index:this.current()}},i=a.camelCase(a.grep(["on",b,d],function(a){return a}).join("-").toLowerCase()),j=a.Event([b,"owl",d||"carousel"].join(".").toLowerCase(),a.extend({relatedTarget:this},h,c));return this._supress[b]||(a.each(this._plugins,function(a,b){b.onTrigger&&b.onTrigger(j)}),this.register({type:e.Type.Event,name:b}),this.$element.trigger(j),this.settings&&"function"==typeof this.settings[i]&&this.settings[i].call(this,j)),j},e.prototype.enter=function(b){a.each([b].concat(this._states.tags[b]||[]),a.proxy(function(a,b){this._states.current[b]===d&&(this._states.current[b]=0),this._states.current[b]++},this))},e.prototype.leave=function(b){a.each([b].concat(this._states.tags[b]||[]),a.proxy(function(a,b){this._states.current[b]--},this))},e.prototype.register=function(b){if(b.type===e.Type.Event){if(a.event.special[b.name]||(a.event.special[b.name]={}),!a.event.special[b.name].owl){var c=a.event.special[b.name]._default;a.event.special[b.name]._default=function(a){return!c||!c.apply||a.namespace&&a.namespace.indexOf("owl")!==-1?a.namespace&&a.namespace.indexOf("owl")>-1:c.apply(this,arguments)},a.event.special[b.name].owl=!0}}else b.type===e.Type.State&&(this._states.tags[b.name]?this._states.tags[b.name]=this._states.tags[b.name].concat(b.tags):this._states.tags[b.name]=b.tags,this._states.tags[b.name]=a.grep(this._states.tags[b.name],a.proxy(function(c,d){return a.inArray(c,this._states.tags[b.name])===d},this)))},e.prototype.suppress=function(b){a.each(b,a.proxy(function(a,b){this._supress[b]=!0},this))},e.prototype.release=function(b){a.each(b,a.proxy(function(a,b){delete this._supress[b]},this))},e.prototype.pointer=function(a){var c={x:null,y:null};return a=a.originalEvent||a||b.event,a=a.touches&&a.touches.length?a.touches[0]:a.changedTouches&&a.changedTouches.length?a.changedTouches[0]:a,a.pageX?(c.x=a.pageX,c.y=a.pageY):(c.x=a.clientX,c.y=a.clientY),c},e.prototype.isNumeric=function(a){return!isNaN(parseFloat(a))},e.prototype.difference=function(a,b){return{x:a.x-b.x,y:a.y-b.y}},a.fn.owlCarousel=function(b){var c=Array.prototype.slice.call(arguments,1);return this.each(function(){var d=a(this),f=d.data("owl.carousel");f||(f=new e(this,"object"==typeof b&&b),d.data("owl.carousel",f),a.each(["next","prev","to","destroy","refresh","replace","add","remove"],function(b,c){f.register({type:e.Type.Event,name:c}),f.$element.on(c+".owl.carousel.core",a.proxy(function(a){a.namespace&&a.relatedTarget!==this&&(this.suppress([c]),f[c].apply(this,[].slice.call(arguments,1)),this.release([c]))},f))})),"string"==typeof b&&"_"!==b.charAt(0)&&f[b].apply(f,c)})},a.fn.owlCarousel.Constructor=e}(window.Zepto||window.jQuery,window,document),function(a,b,c,d){var e=function(b){this._core=b,this._interval=null,this._visible=null,this._handlers={"initialized.owl.carousel":a.proxy(function(a){a.namespace&&this._core.settings.autoRefresh&&this.watch()},this)},this._core.options=a.extend({},e.Defaults,this._core.options),this._core.$element.on(this._handlers)};e.Defaults={autoRefresh:!0,autoRefreshInterval:500},e.prototype.watch=function(){this._interval||(this._visible=this._core.$element.is(":visible"),this._interval=b.setInterval(a.proxy(this.refresh,this),this._core.settings.autoRefreshInterval))},e.prototype.refresh=function(){this._core.$element.is(":visible")!==this._visible&&(this._visible=!this._visible,this._core.$element.toggleClass("owl-hidden",!this._visible),this._visible&&this._core.invalidate("width")&&this._core.refresh())},e.prototype.destroy=function(){var a,c;b.clearInterval(this._interval);for(a in this._handlers)this._core.$element.off(a,this._handlers[a]);for(c in Object.getOwnPropertyNames(this))"function"!=typeof this[c]&&(this[c]=null)},a.fn.owlCarousel.Constructor.Plugins.AutoRefresh=e}(window.Zepto||window.jQuery,window,document),function(a,b,c,d){var e=function(b){this._core=b,this._loaded=[],this._handlers={"initialized.owl.carousel change.owl.carousel resized.owl.carousel":a.proxy(function(b){if(b.namespace&&this._core.settings&&this._core.settings.lazyLoad&&(b.property&&"position"==b.property.name||"initialized"==b.type))for(var c=this._core.settings,e=c.center&&Math.ceil(c.items/2)||c.items,f=c.center&&e*-1||0,g=(b.property&&b.property.value!==d?b.property.value:this._core.current())+f,h=this._core.clones().length,i=a.proxy(function(a,b){this.load(b)},this);f++<e;)this.load(h/2+this._core.relative(g)),h&&a.each(this._core.clones(this._core.relative(g)),i),g++},this)},this._core.options=a.extend({},e.Defaults,this._core.options),this._core.$element.on(this._handlers)};e.Defaults={lazyLoad:!1},e.prototype.load=function(c){var d=this._core.$stage.children().eq(c),e=d&&d.find(".owl-lazy");!e||a.inArray(d.get(0),this._loaded)>-1||(e.each(a.proxy(function(c,d){var e,f=a(d),g=b.devicePixelRatio>1&&f.attr("data-src-retina")||f.attr("data-src");this._core.trigger("load",{element:f,url:g},"lazy"),f.is("img")?f.one("load.owl.lazy",a.proxy(function(){f.css("opacity",1),this._core.trigger("loaded",{element:f,url:g},"lazy")},this)).attr("src",g):(e=new Image,e.onload=a.proxy(function(){f.css({"background-image":'url("'+g+'")',opacity:"1"}),this._core.trigger("loaded",{element:f,url:g},"lazy")},this),e.src=g)},this)),this._loaded.push(d.get(0)))},e.prototype.destroy=function(){var a,b;for(a in this.handlers)this._core.$element.off(a,this.handlers[a]);for(b in Object.getOwnPropertyNames(this))"function"!=typeof this[b]&&(this[b]=null)},a.fn.owlCarousel.Constructor.Plugins.Lazy=e}(window.Zepto||window.jQuery,window,document),function(a,b,c,d){var e=function(b){this._core=b,this._handlers={"initialized.owl.carousel refreshed.owl.carousel":a.proxy(function(a){a.namespace&&this._core.settings.autoHeight&&this.update()},this),"changed.owl.carousel":a.proxy(function(a){a.namespace&&this._core.settings.autoHeight&&"position"==a.property.name&&this.update()},this),"loaded.owl.lazy":a.proxy(function(a){a.namespace&&this._core.settings.autoHeight&&a.element.closest("."+this._core.settings.itemClass).index()===this._core.current()&&this.update()},this)},this._core.options=a.extend({},e.Defaults,this._core.options),this._core.$element.on(this._handlers)};e.Defaults={autoHeight:!1,autoHeightClass:"owl-height"},e.prototype.update=function(){var b=this._core._current,c=b+this._core.settings.items,d=this._core.$stage.children().toArray().slice(b,c),e=[],f=0;a.each(d,function(b,c){e.push(a(c).height())}),f=Math.max.apply(null,e),this._core.$stage.parent().height(f).addClass(this._core.settings.autoHeightClass)},e.prototype.destroy=function(){var a,b;for(a in this._handlers)this._core.$element.off(a,this._handlers[a]);for(b in Object.getOwnPropertyNames(this))"function"!=typeof this[b]&&(this[b]=null)},a.fn.owlCarousel.Constructor.Plugins.AutoHeight=e}(window.Zepto||window.jQuery,window,document),function(a,b,c,d){var e=function(b){this._core=b,this._videos={},this._playing=null,this._handlers={"initialized.owl.carousel":a.proxy(function(a){a.namespace&&this._core.register({type:"state",name:"playing",tags:["interacting"]})},this),"resize.owl.carousel":a.proxy(function(a){a.namespace&&this._core.settings.video&&this.isInFullScreen()&&a.preventDefault()},this),"refreshed.owl.carousel":a.proxy(function(a){a.namespace&&this._core.is("resizing")&&this._core.$stage.find(".cloned .owl-video-frame").remove()},this),"changed.owl.carousel":a.proxy(function(a){a.namespace&&"position"===a.property.name&&this._playing&&this.stop()},this),"prepared.owl.carousel":a.proxy(function(b){if(b.namespace){var c=a(b.content).find(".owl-video");c.length&&(c.css("display","none"),this.fetch(c,a(b.content)))}},this)},this._core.options=a.extend({},e.Defaults,this._core.options),this._core.$element.on(this._handlers),this._core.$element.on("click.owl.video",".owl-video-play-icon",a.proxy(function(a){this.play(a)},this))};e.Defaults={video:!1,videoHeight:!1,videoWidth:!1},e.prototype.fetch=function(a,b){var c=function(){return a.attr("data-vimeo-id")?"vimeo":a.attr("data-vzaar-id")?"vzaar":"youtube"}(),d=a.attr("data-vimeo-id")||a.attr("data-youtube-id")||a.attr("data-vzaar-id"),e=a.attr("data-width")||this._core.settings.videoWidth,f=a.attr("data-height")||this._core.settings.videoHeight,g=a.attr("href");if(!g)throw new Error("Missing video URL.");if(d=g.match(/(http:|https:|)\/\/(player.|www.|app.)?(vimeo\.com|youtu(be\.com|\.be|be\.googleapis\.com)|vzaar\.com)\/(video\/|videos\/|embed\/|channels\/.+\/|groups\/.+\/|watch\?v=|v\/)?([A-Za-z0-9._%-]*)(\&\S+)?/),d[3].indexOf("youtu")>-1)c="youtube";else if(d[3].indexOf("vimeo")>-1)c="vimeo";else{if(!(d[3].indexOf("vzaar")>-1))throw new Error("Video URL not supported.");c="vzaar"}d=d[6],this._videos[g]={type:c,id:d,width:e,height:f},b.attr("data-video",g),this.thumbnail(a,this._videos[g])},e.prototype.thumbnail=function(b,c){var d,e,f,g=c.width&&c.height?'style="width:'+c.width+"px;height:"+c.height+'px;"':"",h=b.find("img"),i="src",j="",k=this._core.settings,l=function(a){e='<div class="owl-video-play-icon"></div>',d=k.lazyLoad?'<div class="owl-video-tn '+j+'" '+i+'="'+a+'"></div>':'<div class="owl-video-tn" style="opacity:1;background-image:url('+a+')"></div>',b.after(d),b.after(e)};if(b.wrap('<div class="owl-video-wrapper"'+g+"></div>"),this._core.settings.lazyLoad&&(i="data-src",j="owl-lazy"),h.length)return l(h.attr(i)),h.remove(),!1;"youtube"===c.type?(f="//img.youtube.com/vi/"+c.id+"/hqdefault.jpg",l(f)):"vimeo"===c.type?a.ajax({type:"GET",url:"//vimeo.com/api/v2/video/"+c.id+".json",jsonp:"callback",dataType:"jsonp",success:function(a){f=a[0].thumbnail_large,l(f)}}):"vzaar"===c.type&&a.ajax({type:"GET",url:"//vzaar.com/api/videos/"+c.id+".json",jsonp:"callback",dataType:"jsonp",success:function(a){f=a.framegrab_url,l(f)}})},e.prototype.stop=function(){this._core.trigger("stop",null,"video"),this._playing.find(".owl-video-frame").remove(),this._playing.removeClass("owl-video-playing"),this._playing=null,this._core.leave("playing"),this._core.trigger("stopped",null,"video")},e.prototype.play=function(b){var c,d=a(b.target),e=d.closest("."+this._core.settings.itemClass),f=this._videos[e.attr("data-video")],g=f.width||"100%",h=f.height||this._core.$stage.height();this._playing||(this._core.enter("playing"),this._core.trigger("play",null,"video"),e=this._core.items(this._core.relative(e.index())),this._core.reset(e.index()),"youtube"===f.type?c='<iframe width="'+g+'" height="'+h+'" src="//www.youtube.com/embed/'+f.id+"?autoplay=1&rel=0&v="+f.id+'" frameborder="0" allowfullscreen></iframe>':"vimeo"===f.type?c='<iframe src="//player.vimeo.com/video/'+f.id+'?autoplay=1" width="'+g+'" height="'+h+'" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>':"vzaar"===f.type&&(c='<iframe frameborder="0"height="'+h+'"width="'+g+'" allowfullscreen mozallowfullscreen webkitAllowFullScreen src="//view.vzaar.com/'+f.id+'/player?autoplay=true"></iframe>'),a('<div class="owl-video-frame">'+c+"</div>").insertAfter(e.find(".owl-video")),this._playing=e.addClass("owl-video-playing"))},e.prototype.isInFullScreen=function(){var b=c.fullscreenElement||c.mozFullScreenElement||c.webkitFullscreenElement;return b&&a(b).parent().hasClass("owl-video-frame")},e.prototype.destroy=function(){var a,b;this._core.$element.off("click.owl.video");for(a in this._handlers)this._core.$element.off(a,this._handlers[a]);for(b in Object.getOwnPropertyNames(this))"function"!=typeof this[b]&&(this[b]=null)},a.fn.owlCarousel.Constructor.Plugins.Video=e}(window.Zepto||window.jQuery,window,document),function(a,b,c,d){var e=function(b){this.core=b,this.core.options=a.extend({},e.Defaults,this.core.options),this.swapping=!0,this.previous=d,this.next=d,this.handlers={"change.owl.carousel":a.proxy(function(a){a.namespace&&"position"==a.property.name&&(this.previous=this.core.current(),this.next=a.property.value)},this),"drag.owl.carousel dragged.owl.carousel translated.owl.carousel":a.proxy(function(a){a.namespace&&(this.swapping="translated"==a.type)},this),"translate.owl.carousel":a.proxy(function(a){a.namespace&&this.swapping&&(this.core.options.animateOut||this.core.options.animateIn)&&this.swap()},this)},this.core.$element.on(this.handlers)};e.Defaults={animateOut:!1,animateIn:!1},e.prototype.swap=function(){if(1===this.core.settings.items&&a.support.animation&&a.support.transition){this.core.speed(0);var b,c=a.proxy(this.clear,this),d=this.core.$stage.children().eq(this.previous),e=this.core.$stage.children().eq(this.next),f=this.core.settings.animateIn,g=this.core.settings.animateOut;this.core.current()!==this.previous&&(g&&(b=this.core.coordinates(this.previous)-this.core.coordinates(this.next),d.one(a.support.animation.end,c).css({left:b+"px"}).addClass("animated owl-animated-out").addClass(g)),f&&e.one(a.support.animation.end,c).addClass("animated owl-animated-in").addClass(f))}},e.prototype.clear=function(b){a(b.target).css({left:""}).removeClass("animated owl-animated-out owl-animated-in").removeClass(this.core.settings.animateIn).removeClass(this.core.settings.animateOut),this.core.onTransitionEnd()},e.prototype.destroy=function(){var a,b;for(a in this.handlers)this.core.$element.off(a,this.handlers[a]);for(b in Object.getOwnPropertyNames(this))"function"!=typeof this[b]&&(this[b]=null)},
a.fn.owlCarousel.Constructor.Plugins.Animate=e}(window.Zepto||window.jQuery,window,document),function(a,b,c,d){var e=function(b){this._core=b,this._timeout=null,this._paused=!1,this._handlers={"changed.owl.carousel":a.proxy(function(a){a.namespace&&"settings"===a.property.name?this._core.settings.autoplay?this.play():this.stop():a.namespace&&"position"===a.property.name&&this._core.settings.autoplay&&this._setAutoPlayInterval()},this),"initialized.owl.carousel":a.proxy(function(a){a.namespace&&this._core.settings.autoplay&&this.play()},this),"play.owl.autoplay":a.proxy(function(a,b,c){a.namespace&&this.play(b,c)},this),"stop.owl.autoplay":a.proxy(function(a){a.namespace&&this.stop()},this),"mouseover.owl.autoplay":a.proxy(function(){this._core.settings.autoplayHoverPause&&this._core.is("rotating")&&this.pause()},this),"mouseleave.owl.autoplay":a.proxy(function(){this._core.settings.autoplayHoverPause&&this._core.is("rotating")&&this.play()},this),"touchstart.owl.core":a.proxy(function(){this._core.settings.autoplayHoverPause&&this._core.is("rotating")&&this.pause()},this),"touchend.owl.core":a.proxy(function(){this._core.settings.autoplayHoverPause&&this.play()},this)},this._core.$element.on(this._handlers),this._core.options=a.extend({},e.Defaults,this._core.options)};e.Defaults={autoplay:!1,autoplayTimeout:5e3,autoplayHoverPause:!1,autoplaySpeed:!1},e.prototype.play=function(a,b){this._paused=!1,this._core.is("rotating")||(this._core.enter("rotating"),this._setAutoPlayInterval())},e.prototype._getNextTimeout=function(d,e){return this._timeout&&b.clearTimeout(this._timeout),b.setTimeout(a.proxy(function(){this._paused||this._core.is("busy")||this._core.is("interacting")||c.hidden||this._core.next(e||this._core.settings.autoplaySpeed)},this),d||this._core.settings.autoplayTimeout)},e.prototype._setAutoPlayInterval=function(){this._timeout=this._getNextTimeout()},e.prototype.stop=function(){this._core.is("rotating")&&(b.clearTimeout(this._timeout),this._core.leave("rotating"))},e.prototype.pause=function(){this._core.is("rotating")&&(this._paused=!0)},e.prototype.destroy=function(){var a,b;this.stop();for(a in this._handlers)this._core.$element.off(a,this._handlers[a]);for(b in Object.getOwnPropertyNames(this))"function"!=typeof this[b]&&(this[b]=null)},a.fn.owlCarousel.Constructor.Plugins.autoplay=e}(window.Zepto||window.jQuery,window,document),function(a,b,c,d){"use strict";var e=function(b){this._core=b,this._initialized=!1,this._pages=[],this._controls={},this._templates=[],this.$element=this._core.$element,this._overrides={next:this._core.next,prev:this._core.prev,to:this._core.to},this._handlers={"prepared.owl.carousel":a.proxy(function(b){b.namespace&&this._core.settings.dotsData&&this._templates.push('<div class="'+this._core.settings.dotClass+'">'+a(b.content).find("[data-dot]").addBack("[data-dot]").attr("data-dot")+"</div>")},this),"added.owl.carousel":a.proxy(function(a){a.namespace&&this._core.settings.dotsData&&this._templates.splice(a.position,0,this._templates.pop())},this),"remove.owl.carousel":a.proxy(function(a){a.namespace&&this._core.settings.dotsData&&this._templates.splice(a.position,1)},this),"changed.owl.carousel":a.proxy(function(a){a.namespace&&"position"==a.property.name&&this.draw()},this),"initialized.owl.carousel":a.proxy(function(a){a.namespace&&!this._initialized&&(this._core.trigger("initialize",null,"navigation"),this.initialize(),this.update(),this.draw(),this._initialized=!0,this._core.trigger("initialized",null,"navigation"))},this),"refreshed.owl.carousel":a.proxy(function(a){a.namespace&&this._initialized&&(this._core.trigger("refresh",null,"navigation"),this.update(),this.draw(),this._core.trigger("refreshed",null,"navigation"))},this)},this._core.options=a.extend({},e.Defaults,this._core.options),this.$element.on(this._handlers)};e.Defaults={nav:!1,navText:["prev","next"],navSpeed:!1,navElement:"div",navContainer:!1,navContainerClass:"owl-nav",navClass:["owl-prev","owl-next"],slideBy:1,dotClass:"owl-dot",dotsClass:"owl-dots",dots:!0,dotsEach:!1,dotsData:!1,dotsSpeed:!1,dotsContainer:!1},e.prototype.initialize=function(){var b,c=this._core.settings;this._controls.$relative=(c.navContainer?a(c.navContainer):a("<div>").addClass(c.navContainerClass).appendTo(this.$element)).addClass("disabled"),this._controls.$previous=a("<"+c.navElement+">").addClass(c.navClass[0]).html(c.navText[0]).prependTo(this._controls.$relative).on("click",a.proxy(function(a){this.prev(c.navSpeed)},this)),this._controls.$next=a("<"+c.navElement+">").addClass(c.navClass[1]).html(c.navText[1]).appendTo(this._controls.$relative).on("click",a.proxy(function(a){this.next(c.navSpeed)},this)),c.dotsData||(this._templates=[a("<div>").addClass(c.dotClass).append(a("<span>")).prop("outerHTML")]),this._controls.$absolute=(c.dotsContainer?a(c.dotsContainer):a("<div>").addClass(c.dotsClass).appendTo(this.$element)).addClass("disabled"),this._controls.$absolute.on("click","div",a.proxy(function(b){var d=a(b.target).parent().is(this._controls.$absolute)?a(b.target).index():a(b.target).parent().index();b.preventDefault(),this.to(d,c.dotsSpeed)},this));for(b in this._overrides)this._core[b]=a.proxy(this[b],this)},e.prototype.destroy=function(){var a,b,c,d;for(a in this._handlers)this.$element.off(a,this._handlers[a]);for(b in this._controls)this._controls[b].remove();for(d in this.overides)this._core[d]=this._overrides[d];for(c in Object.getOwnPropertyNames(this))"function"!=typeof this[c]&&(this[c]=null)},e.prototype.update=function(){var a,b,c,d=this._core.clones().length/2,e=d+this._core.items().length,f=this._core.maximum(!0),g=this._core.settings,h=g.center||g.autoWidth||g.dotsData?1:g.dotsEach||g.items;if("page"!==g.slideBy&&(g.slideBy=Math.min(g.slideBy,g.items)),g.dots||"page"==g.slideBy)for(this._pages=[],a=d,b=0,c=0;a<e;a++){if(b>=h||0===b){if(this._pages.push({start:Math.min(f,a-d),end:a-d+h-1}),Math.min(f,a-d)===f)break;b=0,++c}b+=this._core.mergers(this._core.relative(a))}},e.prototype.draw=function(){var b,c=this._core.settings,d=this._core.items().length<=c.items,e=this._core.relative(this._core.current()),f=c.loop||c.rewind;this._controls.$relative.toggleClass("disabled",!c.nav||d),c.nav&&(this._controls.$previous.toggleClass("disabled",!f&&e<=this._core.minimum(!0)),this._controls.$next.toggleClass("disabled",!f&&e>=this._core.maximum(!0))),this._controls.$absolute.toggleClass("disabled",!c.dots||d),c.dots&&(b=this._pages.length-this._controls.$absolute.children().length,c.dotsData&&0!==b?this._controls.$absolute.html(this._templates.join("")):b>0?this._controls.$absolute.append(new Array(b+1).join(this._templates[0])):b<0&&this._controls.$absolute.children().slice(b).remove(),this._controls.$absolute.find(".active").removeClass("active"),this._controls.$absolute.children().eq(a.inArray(this.current(),this._pages)).addClass("active"))},e.prototype.onTrigger=function(b){var c=this._core.settings;b.page={index:a.inArray(this.current(),this._pages),count:this._pages.length,size:c&&(c.center||c.autoWidth||c.dotsData?1:c.dotsEach||c.items)}},e.prototype.current=function(){var b=this._core.relative(this._core.current());return a.grep(this._pages,a.proxy(function(a,c){return a.start<=b&&a.end>=b},this)).pop()},e.prototype.getPosition=function(b){var c,d,e=this._core.settings;return"page"==e.slideBy?(c=a.inArray(this.current(),this._pages),d=this._pages.length,b?++c:--c,c=this._pages[(c%d+d)%d].start):(c=this._core.relative(this._core.current()),d=this._core.items().length,b?c+=e.slideBy:c-=e.slideBy),c},e.prototype.next=function(b){a.proxy(this._overrides.to,this._core)(this.getPosition(!0),b)},e.prototype.prev=function(b){a.proxy(this._overrides.to,this._core)(this.getPosition(!1),b)},e.prototype.to=function(b,c,d){var e;!d&&this._pages.length?(e=this._pages.length,a.proxy(this._overrides.to,this._core)(this._pages[(b%e+e)%e].start,c)):a.proxy(this._overrides.to,this._core)(b,c)},a.fn.owlCarousel.Constructor.Plugins.Navigation=e}(window.Zepto||window.jQuery,window,document),function(a,b,c,d){"use strict";var e=function(c){this._core=c,this._hashes={},this.$element=this._core.$element,this._handlers={"initialized.owl.carousel":a.proxy(function(c){c.namespace&&"URLHash"===this._core.settings.startPosition&&a(b).trigger("hashchange.owl.navigation")},this),"prepared.owl.carousel":a.proxy(function(b){if(b.namespace){var c=a(b.content).find("[data-hash]").addBack("[data-hash]").attr("data-hash");if(!c)return;this._hashes[c]=b.content}},this),"changed.owl.carousel":a.proxy(function(c){if(c.namespace&&"position"===c.property.name){var d=this._core.items(this._core.relative(this._core.current())),e=a.map(this._hashes,function(a,b){return a===d?b:null}).join();if(!e||b.location.hash.slice(1)===e)return;b.location.hash=e}},this)},this._core.options=a.extend({},e.Defaults,this._core.options),this.$element.on(this._handlers),a(b).on("hashchange.owl.navigation",a.proxy(function(a){var c=b.location.hash.substring(1),e=this._core.$stage.children(),f=this._hashes[c]&&e.index(this._hashes[c]);f!==d&&f!==this._core.current()&&this._core.to(this._core.relative(f),!1,!0)},this))};e.Defaults={URLhashListener:!1},e.prototype.destroy=function(){var c,d;a(b).off("hashchange.owl.navigation");for(c in this._handlers)this._core.$element.off(c,this._handlers[c]);for(d in Object.getOwnPropertyNames(this))"function"!=typeof this[d]&&(this[d]=null)},a.fn.owlCarousel.Constructor.Plugins.Hash=e}(window.Zepto||window.jQuery,window,document),function(a,b,c,d){function e(b,c){var e=!1,f=b.charAt(0).toUpperCase()+b.slice(1);return a.each((b+" "+h.join(f+" ")+f).split(" "),function(a,b){if(g[b]!==d)return e=!c||b,!1}),e}function f(a){return e(a,!0)}var g=a("<support>").get(0).style,h="Webkit Moz O ms".split(" "),i={transition:{end:{WebkitTransition:"webkitTransitionEnd",MozTransition:"transitionend",OTransition:"oTransitionEnd",transition:"transitionend"}},animation:{end:{WebkitAnimation:"webkitAnimationEnd",MozAnimation:"animationend",OAnimation:"oAnimationEnd",animation:"animationend"}}},j={csstransforms:function(){return!!e("transform")},csstransforms3d:function(){return!!e("perspective")},csstransitions:function(){return!!e("transition")},cssanimations:function(){return!!e("animation")}};j.csstransitions()&&(a.support.transition=new String(f("transition")),a.support.transition.end=i.transition.end[a.support.transition]),j.cssanimations()&&(a.support.animation=new String(f("animation")),a.support.animation.end=i.animation.end[a.support.animation]),j.csstransforms()&&(a.support.transform=new String(f("transform")),a.support.transform3d=j.csstransforms3d())}(window.Zepto||window.jQuery,window,document);;
/*jslint browser: true*/
/*global jQuery*/
/*jslint vars: true*/

(function ($) {
    $.fn.bootstrapDynamicTabs = function () {

		this.each(function () {
			var $horizontalContainer = $(this);

			function DynamicTabs() {

				// create wrapper and menu if first time
				if ($horizontalContainer.parent('.dynamic-tabs-container').length === 0) {

					// add wrapper
					$horizontalContainer.addClass("dynamic-tabs").wrap("<div class='dynamic-tabs-container clearfix'></div>");

					// Attach a dropdown to the right of the tabs bar
					// This will be toggled if tabs can't fit in a given viewport size
					$horizontalContainer.after(
						"<div class='nav navbar-nav navbar-right dropdown tabs-dropdown'><a href='#' class='btn btn-default dropdown-toggle' data-toggle='dropdown'><i class='fa fa-angle-down'></i></a><ul class='dropdown-menu' role='menu'><div class='dropdown-header visible-xs'><p class='count'>Tabs</p><button type='button' class='close' data-dismiss='dropdown'><span aria-hidden='true'>&times;</span></button><div class='divider visible-xs'></div></div></ul></div>"
					);
				}

				// Mark each tab with a 'tab-id' for easy access
				var $tabs = $horizontalContainer.children('li');
				$tabs.each(function (i) {
					$(this)
						.addClass("dynamic-tab")
						.attr("tab-id", i);
				});

				// Update tabs funtion
				var updateTabs = function () {

					var i, horizontalTab, tabId, verticalTab, tabWidth, isVisible;

					var availableWidth = $horizontalContainer.width();
					var numVisibleHorizontalTabs = 1;

					var activeTab = $horizontalContainer.find('.active');
					var activeTabIndex = activeTab.index();

					// active tab is always visible
					activeTab.toggleClass('hidden', false);
					availableWidth = availableWidth - activeTab.outerWidth(true);

					// Determine which tabs to show/hide
					var $tabs = $horizontalContainer.children('li');

					// from active to firt
					for (i = activeTabIndex - 1; i >= 0; i--) {
						horizontalTab = $tabs.eq(i);
						if (availableWidth > 0) {
							horizontalTab.toggleClass('hidden', false);
							tabWidth = horizontalTab.outerWidth(true);
							isVisible = tabWidth <= availableWidth;
							if (isVisible) {
								availableWidth = availableWidth - tabWidth;
								numVisibleHorizontalTabs++;
							} else {
								availableWidth = -1;
							}
						} else {
							isVisible = false;
						}
						horizontalTab.toggleClass('hidden', !isVisible);
					}

					// from active to last
					for (i = activeTabIndex + 1; i < $tabs.length; i++) {
						horizontalTab = $tabs.eq(i);
						if (availableWidth > 0) {
							horizontalTab.toggleClass('hidden', false);
							tabWidth = horizontalTab.outerWidth(true);
							isVisible = tabWidth <= availableWidth;
							if (isVisible) {
								availableWidth = availableWidth - tabWidth;
								numVisibleHorizontalTabs++;
							} else {
								availableWidth = -1;
							}
						} else {
							isVisible = false;
						}
						horizontalTab.toggleClass('hidden', !isVisible);
					}

					// Toggle the Tabs dropdown if there are more tabs than can fit in the tabs horizontal container
					var numVisibleVerticalTabs = $tabs.length - numVisibleHorizontalTabs;
					var hasVerticalTabs = (numVisibleVerticalTabs > 0);
					$horizontalContainer.siblings(".tabs-dropdown").toggleClass("hidden", !hasVerticalTabs);
				};

				// tabs dropdown event
				var onDropDow = function () {
					// Clone each tab into the dropdown
					var $verticalContainer = $horizontalContainer.siblings(".tabs-dropdown").find(".dropdown-menu");

					$verticalContainer.html("");
					$verticalContainer.css("z-index", 1050);
					
					$horizontalContainer.children('li').each( function (index, element) {
						if ($(element).children('a').css("display") !== 'none') {
							var htab = document.createElement("li");

							$(htab).append('<a href="'+$(element).children('a').attr('href')+'">'+$(element).children('a').html()+'</a>');
							$(htab).toggleClass('active',$(element).hasClass('active'));
							$(htab).attr("tab-id", index);
							$(htab).on("click", function (e) {
								e.preventDefault();
								$horizontalContainer.find("[tab-id=" + $(this).attr("tab-id") + "] a").tab("show");
								updateTabs();
							});
							$verticalContainer.append(htab);
						}
					});
				};
				$horizontalContainer.siblings(".tabs-dropdown").off('show.bs.dropdown').on('show.bs.dropdown', onDropDow);

				// update tabs
				updateTabs();

				// Update tabs on window resize
				$(window).off("resize.dyntabs").on("resize.dyntabs", function () {
					updateTabs();
				});
			}

			return new DynamicTabs();
		});
	};
}(jQuery));
;
/*! PhotoSwipe - v4.1.2 - 2017-04-05
* http://photoswipe.com
* Copyright (c) 2017 Dmitry Semenov; */
!function(a,b){"function"==typeof define&&define.amd?define(b):"object"==typeof exports?module.exports=b():a.PhotoSwipe=b()}(this,function(){"use strict";var a=function(a,b,c,d){var e={features:null,bind:function(a,b,c,d){var e=(d?"remove":"add")+"EventListener";b=b.split(" ");for(var f=0;f<b.length;f++)b[f]&&a[e](b[f],c,!1)},isArray:function(a){return a instanceof Array},createEl:function(a,b){var c=document.createElement(b||"div");return a&&(c.className=a),c},getScrollY:function(){var a=window.pageYOffset;return void 0!==a?a:document.documentElement.scrollTop},unbind:function(a,b,c){e.bind(a,b,c,!0)},removeClass:function(a,b){var c=new RegExp("(\\s|^)"+b+"(\\s|$)");a.className=a.className.replace(c," ").replace(/^\s\s*/,"").replace(/\s\s*$/,"")},addClass:function(a,b){e.hasClass(a,b)||(a.className+=(a.className?" ":"")+b)},hasClass:function(a,b){return a.className&&new RegExp("(^|\\s)"+b+"(\\s|$)").test(a.className)},getChildByClass:function(a,b){for(var c=a.firstChild;c;){if(e.hasClass(c,b))return c;c=c.nextSibling}},arraySearch:function(a,b,c){for(var d=a.length;d--;)if(a[d][c]===b)return d;return-1},extend:function(a,b,c){for(var d in b)if(b.hasOwnProperty(d)){if(c&&a.hasOwnProperty(d))continue;a[d]=b[d]}},easing:{sine:{out:function(a){return Math.sin(a*(Math.PI/2))},inOut:function(a){return-(Math.cos(Math.PI*a)-1)/2}},cubic:{out:function(a){return--a*a*a+1}}},detectFeatures:function(){if(e.features)return e.features;var a=e.createEl(),b=a.style,c="",d={};if(d.oldIE=document.all&&!document.addEventListener,d.touch="ontouchstart"in window,window.requestAnimationFrame&&(d.raf=window.requestAnimationFrame,d.caf=window.cancelAnimationFrame),d.pointerEvent=navigator.pointerEnabled||navigator.msPointerEnabled,!d.pointerEvent){var f=navigator.userAgent;if(/iP(hone|od)/.test(navigator.platform)){var g=navigator.appVersion.match(/OS (\d+)_(\d+)_?(\d+)?/);g&&g.length>0&&(g=parseInt(g[1],10),g>=1&&g<8&&(d.isOldIOSPhone=!0))}var h=f.match(/Android\s([0-9\.]*)/),i=h?h[1]:0;i=parseFloat(i),i>=1&&(i<4.4&&(d.isOldAndroid=!0),d.androidVersion=i),d.isMobileOpera=/opera mini|opera mobi/i.test(f)}for(var j,k,l=["transform","perspective","animationName"],m=["","webkit","Moz","ms","O"],n=0;n<4;n++){c=m[n];for(var o=0;o<3;o++)j=l[o],k=c+(c?j.charAt(0).toUpperCase()+j.slice(1):j),!d[j]&&k in b&&(d[j]=k);c&&!d.raf&&(c=c.toLowerCase(),d.raf=window[c+"RequestAnimationFrame"],d.raf&&(d.caf=window[c+"CancelAnimationFrame"]||window[c+"CancelRequestAnimationFrame"]))}if(!d.raf){var p=0;d.raf=function(a){var b=(new Date).getTime(),c=Math.max(0,16-(b-p)),d=window.setTimeout(function(){a(b+c)},c);return p=b+c,d},d.caf=function(a){clearTimeout(a)}}return d.svg=!!document.createElementNS&&!!document.createElementNS("http://www.w3.org/2000/svg","svg").createSVGRect,e.features=d,d}};e.detectFeatures(),e.features.oldIE&&(e.bind=function(a,b,c,d){b=b.split(" ");for(var e,f=(d?"detach":"attach")+"Event",g=function(){c.handleEvent.call(c)},h=0;h<b.length;h++)if(e=b[h])if("object"==typeof c&&c.handleEvent){if(d){if(!c["oldIE"+e])return!1}else c["oldIE"+e]=g;a[f]("on"+e,c["oldIE"+e])}else a[f]("on"+e,c)});var f=this,g=25,h=3,i={allowPanToNext:!0,spacing:.12,bgOpacity:1,mouseUsed:!1,loop:!0,pinchToClose:!0,closeOnScroll:!0,closeOnVerticalDrag:!0,verticalDragRange:.75,hideAnimationDuration:333,showAnimationDuration:333,showHideOpacity:!1,focus:!0,escKey:!0,arrowKeys:!0,mainScrollEndFriction:.35,panEndFriction:.35,isClickableElement:function(a){return"A"===a.tagName},getDoubleTapZoom:function(a,b){return a?1:b.initialZoomLevel<.7?1:1.33},maxSpreadZoom:1.33,modal:!0,scaleMode:"fit"};e.extend(i,d);var j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z,A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z,$,_,aa,ba,ca,da,ea,fa,ga,ha,ia,ja,ka,la,ma=function(){return{x:0,y:0}},na=ma(),oa=ma(),pa=ma(),qa={},ra=0,sa={},ta=ma(),ua=0,va=!0,wa=[],xa={},ya=!1,za=function(a,b){e.extend(f,b.publicMethods),wa.push(a)},Aa=function(a){var b=ac();return a>b-1?a-b:a<0?b+a:a},Ba={},Ca=function(a,b){return Ba[a]||(Ba[a]=[]),Ba[a].push(b)},Da=function(a){var b=Ba[a];if(b){var c=Array.prototype.slice.call(arguments);c.shift();for(var d=0;d<b.length;d++)b[d].apply(f,c)}},Ea=function(){return(new Date).getTime()},Fa=function(a){ja=a,f.bg.style.opacity=a*i.bgOpacity},Ga=function(a,b,c,d,e){(!ya||e&&e!==f.currItem)&&(d/=e?e.fitRatio:f.currItem.fitRatio),a[E]=u+b+"px, "+c+"px"+v+" scale("+d+")"},Ha=function(a){ea&&(a&&(s>f.currItem.fitRatio?ya||(mc(f.currItem,!1,!0),ya=!0):ya&&(mc(f.currItem),ya=!1)),Ga(ea,pa.x,pa.y,s))},Ia=function(a){a.container&&Ga(a.container.style,a.initialPosition.x,a.initialPosition.y,a.initialZoomLevel,a)},Ja=function(a,b){b[E]=u+a+"px, 0px"+v},Ka=function(a,b){if(!i.loop&&b){var c=m+(ta.x*ra-a)/ta.x,d=Math.round(a-tb.x);(c<0&&d>0||c>=ac()-1&&d<0)&&(a=tb.x+d*i.mainScrollEndFriction)}tb.x=a,Ja(a,n)},La=function(a,b){var c=ub[a]-sa[a];return oa[a]+na[a]+c-c*(b/t)},Ma=function(a,b){a.x=b.x,a.y=b.y,b.id&&(a.id=b.id)},Na=function(a){a.x=Math.round(a.x),a.y=Math.round(a.y)},Oa=null,Pa=function(){Oa&&(e.unbind(document,"mousemove",Pa),e.addClass(a,"pswp--has_mouse"),i.mouseUsed=!0,Da("mouseUsed")),Oa=setTimeout(function(){Oa=null},100)},Qa=function(){e.bind(document,"keydown",f),N.transform&&e.bind(f.scrollWrap,"click",f),i.mouseUsed||e.bind(document,"mousemove",Pa),e.bind(window,"resize scroll orientationchange",f),Da("bindEvents")},Ra=function(){e.unbind(window,"resize scroll orientationchange",f),e.unbind(window,"scroll",r.scroll),e.unbind(document,"keydown",f),e.unbind(document,"mousemove",Pa),N.transform&&e.unbind(f.scrollWrap,"click",f),V&&e.unbind(window,p,f),clearTimeout(O),Da("unbindEvents")},Sa=function(a,b){var c=ic(f.currItem,qa,a);return b&&(da=c),c},Ta=function(a){return a||(a=f.currItem),a.initialZoomLevel},Ua=function(a){return a||(a=f.currItem),a.w>0?i.maxSpreadZoom:1},Va=function(a,b,c,d){return d===f.currItem.initialZoomLevel?(c[a]=f.currItem.initialPosition[a],!0):(c[a]=La(a,d),c[a]>b.min[a]?(c[a]=b.min[a],!0):c[a]<b.max[a]&&(c[a]=b.max[a],!0))},Wa=function(){if(E){var b=N.perspective&&!G;return u="translate"+(b?"3d(":"("),void(v=N.perspective?", 0px)":")")}E="left",e.addClass(a,"pswp--ie"),Ja=function(a,b){b.left=a+"px"},Ia=function(a){var b=a.fitRatio>1?1:a.fitRatio,c=a.container.style,d=b*a.w,e=b*a.h;c.width=d+"px",c.height=e+"px",c.left=a.initialPosition.x+"px",c.top=a.initialPosition.y+"px"},Ha=function(){if(ea){var a=ea,b=f.currItem,c=b.fitRatio>1?1:b.fitRatio,d=c*b.w,e=c*b.h;a.width=d+"px",a.height=e+"px",a.left=pa.x+"px",a.top=pa.y+"px"}}},Xa=function(a){var b="";i.escKey&&27===a.keyCode?b="close":i.arrowKeys&&(37===a.keyCode?b="prev":39===a.keyCode&&(b="next")),b&&(a.ctrlKey||a.altKey||a.shiftKey||a.metaKey||(a.preventDefault?a.preventDefault():a.returnValue=!1,f[b]()))},Ya=function(a){a&&(Y||X||fa||T)&&(a.preventDefault(),a.stopPropagation())},Za=function(){f.setScrollOffset(0,e.getScrollY())},$a={},_a=0,ab=function(a){$a[a]&&($a[a].raf&&I($a[a].raf),_a--,delete $a[a])},bb=function(a){$a[a]&&ab(a),$a[a]||(_a++,$a[a]={})},cb=function(){for(var a in $a)$a.hasOwnProperty(a)&&ab(a)},db=function(a,b,c,d,e,f,g){var h,i=Ea();bb(a);var j=function(){if($a[a]){if(h=Ea()-i,h>=d)return ab(a),f(c),void(g&&g());f((c-b)*e(h/d)+b),$a[a].raf=H(j)}};j()},eb={shout:Da,listen:Ca,viewportSize:qa,options:i,isMainScrollAnimating:function(){return fa},getZoomLevel:function(){return s},getCurrentIndex:function(){return m},isDragging:function(){return V},isZooming:function(){return aa},setScrollOffset:function(a,b){sa.x=a,M=sa.y=b,Da("updateScrollOffset",sa)},applyZoomPan:function(a,b,c,d){pa.x=b,pa.y=c,s=a,Ha(d)},init:function(){if(!j&&!k){var c;f.framework=e,f.template=a,f.bg=e.getChildByClass(a,"pswp__bg"),J=a.className,j=!0,N=e.detectFeatures(),H=N.raf,I=N.caf,E=N.transform,L=N.oldIE,f.scrollWrap=e.getChildByClass(a,"pswp__scroll-wrap"),f.container=e.getChildByClass(f.scrollWrap,"pswp__container"),n=f.container.style,f.itemHolders=y=[{el:f.container.children[0],wrap:0,index:-1},{el:f.container.children[1],wrap:0,index:-1},{el:f.container.children[2],wrap:0,index:-1}],y[0].el.style.display=y[2].el.style.display="none",Wa(),r={resize:f.updateSize,orientationchange:function(){clearTimeout(O),O=setTimeout(function(){qa.x!==f.scrollWrap.clientWidth&&f.updateSize()},500)},scroll:Za,keydown:Xa,click:Ya};var d=N.isOldIOSPhone||N.isOldAndroid||N.isMobileOpera;for(N.animationName&&N.transform&&!d||(i.showAnimationDuration=i.hideAnimationDuration=0),c=0;c<wa.length;c++)f["init"+wa[c]]();if(b){var g=f.ui=new b(f,e);g.init()}Da("firstUpdate"),m=m||i.index||0,(isNaN(m)||m<0||m>=ac())&&(m=0),f.currItem=_b(m),(N.isOldIOSPhone||N.isOldAndroid)&&(va=!1),a.setAttribute("aria-hidden","false"),i.modal&&(va?a.style.position="fixed":(a.style.position="absolute",a.style.top=e.getScrollY()+"px")),void 0===M&&(Da("initialLayout"),M=K=e.getScrollY());var l="pswp--open ";for(i.mainClass&&(l+=i.mainClass+" "),i.showHideOpacity&&(l+="pswp--animate_opacity "),l+=G?"pswp--touch":"pswp--notouch",l+=N.animationName?" pswp--css_animation":"",l+=N.svg?" pswp--svg":"",e.addClass(a,l),f.updateSize(),o=-1,ua=null,c=0;c<h;c++)Ja((c+o)*ta.x,y[c].el.style);L||e.bind(f.scrollWrap,q,f),Ca("initialZoomInEnd",function(){f.setContent(y[0],m-1),f.setContent(y[2],m+1),y[0].el.style.display=y[2].el.style.display="block",i.focus&&a.focus(),Qa()}),f.setContent(y[1],m),f.updateCurrItem(),Da("afterInit"),va||(w=setInterval(function(){_a||V||aa||s!==f.currItem.initialZoomLevel||f.updateSize()},1e3)),e.addClass(a,"pswp--visible")}},close:function(){j&&(j=!1,k=!0,Da("close"),Ra(),cc(f.currItem,null,!0,f.destroy))},destroy:function(){Da("destroy"),Xb&&clearTimeout(Xb),a.setAttribute("aria-hidden","true"),a.className=J,w&&clearInterval(w),e.unbind(f.scrollWrap,q,f),e.unbind(window,"scroll",f),zb(),cb(),Ba=null},panTo:function(a,b,c){c||(a>da.min.x?a=da.min.x:a<da.max.x&&(a=da.max.x),b>da.min.y?b=da.min.y:b<da.max.y&&(b=da.max.y)),pa.x=a,pa.y=b,Ha()},handleEvent:function(a){a=a||window.event,r[a.type]&&r[a.type](a)},goTo:function(a){a=Aa(a);var b=a-m;ua=b,m=a,f.currItem=_b(m),ra-=b,Ka(ta.x*ra),cb(),fa=!1,f.updateCurrItem()},next:function(){f.goTo(m+1)},prev:function(){f.goTo(m-1)},updateCurrZoomItem:function(a){if(a&&Da("beforeChange",0),y[1].el.children.length){var b=y[1].el.children[0];ea=e.hasClass(b,"pswp__zoom-wrap")?b.style:null}else ea=null;da=f.currItem.bounds,t=s=f.currItem.initialZoomLevel,pa.x=da.center.x,pa.y=da.center.y,a&&Da("afterChange")},invalidateCurrItems:function(){x=!0;for(var a=0;a<h;a++)y[a].item&&(y[a].item.needsUpdate=!0)},updateCurrItem:function(a){if(0!==ua){var b,c=Math.abs(ua);if(!(a&&c<2)){f.currItem=_b(m),ya=!1,Da("beforeChange",ua),c>=h&&(o+=ua+(ua>0?-h:h),c=h);for(var d=0;d<c;d++)ua>0?(b=y.shift(),y[h-1]=b,o++,Ja((o+2)*ta.x,b.el.style),f.setContent(b,m-c+d+1+1)):(b=y.pop(),y.unshift(b),o--,Ja(o*ta.x,b.el.style),f.setContent(b,m+c-d-1-1));if(ea&&1===Math.abs(ua)){var e=_b(z);e.initialZoomLevel!==s&&(ic(e,qa),mc(e),Ia(e))}ua=0,f.updateCurrZoomItem(),z=m,Da("afterChange")}}},updateSize:function(b){if(!va&&i.modal){var c=e.getScrollY();if(M!==c&&(a.style.top=c+"px",M=c),!b&&xa.x===window.innerWidth&&xa.y===window.innerHeight)return;xa.x=window.innerWidth,xa.y=window.innerHeight,a.style.height=xa.y+"px"}if(qa.x=f.scrollWrap.clientWidth,qa.y=f.scrollWrap.clientHeight,Za(),ta.x=qa.x+Math.round(qa.x*i.spacing),ta.y=qa.y,Ka(ta.x*ra),Da("beforeResize"),void 0!==o){for(var d,g,j,k=0;k<h;k++)d=y[k],Ja((k+o)*ta.x,d.el.style),j=m+k-1,i.loop&&ac()>2&&(j=Aa(j)),g=_b(j),g&&(x||g.needsUpdate||!g.bounds)?(f.cleanSlide(g),f.setContent(d,j),1===k&&(f.currItem=g,f.updateCurrZoomItem(!0)),g.needsUpdate=!1):d.index===-1&&j>=0&&f.setContent(d,j),g&&g.container&&(ic(g,qa),mc(g),Ia(g));x=!1}t=s=f.currItem.initialZoomLevel,da=f.currItem.bounds,da&&(pa.x=da.center.x,pa.y=da.center.y,Ha(!0)),Da("resize")},zoomTo:function(a,b,c,d,f){b&&(t=s,ub.x=Math.abs(b.x)-pa.x,ub.y=Math.abs(b.y)-pa.y,Ma(oa,pa));var g=Sa(a,!1),h={};Va("x",g,h,a),Va("y",g,h,a);var i=s,j={x:pa.x,y:pa.y};Na(h);var k=function(b){1===b?(s=a,pa.x=h.x,pa.y=h.y):(s=(a-i)*b+i,pa.x=(h.x-j.x)*b+j.x,pa.y=(h.y-j.y)*b+j.y),f&&f(b),Ha(1===b)};c?db("customZoomTo",0,1,c,d||e.easing.sine.inOut,k):k(1)}},fb=30,gb=10,hb={},ib={},jb={},kb={},lb={},mb=[],nb={},ob=[],pb={},qb=0,rb=ma(),sb=0,tb=ma(),ub=ma(),vb=ma(),wb=function(a,b){return a.x===b.x&&a.y===b.y},xb=function(a,b){return Math.abs(a.x-b.x)<g&&Math.abs(a.y-b.y)<g},yb=function(a,b){return pb.x=Math.abs(a.x-b.x),pb.y=Math.abs(a.y-b.y),Math.sqrt(pb.x*pb.x+pb.y*pb.y)},zb=function(){Z&&(I(Z),Z=null)},Ab=function(){V&&(Z=H(Ab),Qb())},Bb=function(){return!("fit"===i.scaleMode&&s===f.currItem.initialZoomLevel)},Cb=function(a,b){return!(!a||a===document)&&(!(a.getAttribute("class")&&a.getAttribute("class").indexOf("pswp__scroll-wrap")>-1)&&(b(a)?a:Cb(a.parentNode,b)))},Db={},Eb=function(a,b){return Db.prevent=!Cb(a.target,i.isClickableElement),Da("preventDragEvent",a,b,Db),Db.prevent},Fb=function(a,b){return b.x=a.pageX,b.y=a.pageY,b.id=a.identifier,b},Gb=function(a,b,c){c.x=.5*(a.x+b.x),c.y=.5*(a.y+b.y)},Hb=function(a,b,c){if(a-Q>50){var d=ob.length>2?ob.shift():{};d.x=b,d.y=c,ob.push(d),Q=a}},Ib=function(){var a=pa.y-f.currItem.initialPosition.y;return 1-Math.abs(a/(qa.y/2))},Jb={},Kb={},Lb=[],Mb=function(a){for(;Lb.length>0;)Lb.pop();return F?(la=0,mb.forEach(function(a){0===la?Lb[0]=a:1===la&&(Lb[1]=a),la++})):a.type.indexOf("touch")>-1?a.touches&&a.touches.length>0&&(Lb[0]=Fb(a.touches[0],Jb),a.touches.length>1&&(Lb[1]=Fb(a.touches[1],Kb))):(Jb.x=a.pageX,Jb.y=a.pageY,Jb.id="",Lb[0]=Jb),Lb},Nb=function(a,b){var c,d,e,g,h=0,j=pa[a]+b[a],k=b[a]>0,l=tb.x+b.x,m=tb.x-nb.x;return c=j>da.min[a]||j<da.max[a]?i.panEndFriction:1,j=pa[a]+b[a]*c,!i.allowPanToNext&&s!==f.currItem.initialZoomLevel||(ea?"h"!==ga||"x"!==a||X||(k?(j>da.min[a]&&(c=i.panEndFriction,h=da.min[a]-j,d=da.min[a]-oa[a]),(d<=0||m<0)&&ac()>1?(g=l,m<0&&l>nb.x&&(g=nb.x)):da.min.x!==da.max.x&&(e=j)):(j<da.max[a]&&(c=i.panEndFriction,h=j-da.max[a],d=oa[a]-da.max[a]),(d<=0||m>0)&&ac()>1?(g=l,m>0&&l<nb.x&&(g=nb.x)):da.min.x!==da.max.x&&(e=j))):g=l,"x"!==a)?void(fa||$||s>f.currItem.fitRatio&&(pa[a]+=b[a]*c)):(void 0!==g&&(Ka(g,!0),$=g!==nb.x),da.min.x!==da.max.x&&(void 0!==e?pa.x=e:$||(pa.x+=b.x*c)),void 0!==g)},Ob=function(a){if(!("mousedown"===a.type&&a.button>0)){if($b)return void a.preventDefault();if(!U||"mousedown"!==a.type){if(Eb(a,!0)&&a.preventDefault(),Da("pointerDown"),F){var b=e.arraySearch(mb,a.pointerId,"id");b<0&&(b=mb.length),mb[b]={x:a.pageX,y:a.pageY,id:a.pointerId}}var c=Mb(a),d=c.length;_=null,cb(),V&&1!==d||(V=ha=!0,e.bind(window,p,f),S=ka=ia=T=$=Y=W=X=!1,ga=null,Da("firstTouchStart",c),Ma(oa,pa),na.x=na.y=0,Ma(kb,c[0]),Ma(lb,kb),nb.x=ta.x*ra,ob=[{x:kb.x,y:kb.y}],Q=P=Ea(),Sa(s,!0),zb(),Ab()),!aa&&d>1&&!fa&&!$&&(t=s,X=!1,aa=W=!0,na.y=na.x=0,Ma(oa,pa),Ma(hb,c[0]),Ma(ib,c[1]),Gb(hb,ib,vb),ub.x=Math.abs(vb.x)-pa.x,ub.y=Math.abs(vb.y)-pa.y,ba=ca=yb(hb,ib))}}},Pb=function(a){if(a.preventDefault(),F){var b=e.arraySearch(mb,a.pointerId,"id");if(b>-1){var c=mb[b];c.x=a.pageX,c.y=a.pageY}}if(V){var d=Mb(a);if(ga||Y||aa)_=d;else if(tb.x!==ta.x*ra)ga="h";else{var f=Math.abs(d[0].x-kb.x)-Math.abs(d[0].y-kb.y);Math.abs(f)>=gb&&(ga=f>0?"h":"v",_=d)}}},Qb=function(){if(_){var a=_.length;if(0!==a)if(Ma(hb,_[0]),jb.x=hb.x-kb.x,jb.y=hb.y-kb.y,aa&&a>1){if(kb.x=hb.x,kb.y=hb.y,!jb.x&&!jb.y&&wb(_[1],ib))return;Ma(ib,_[1]),X||(X=!0,Da("zoomGestureStarted"));var b=yb(hb,ib),c=Vb(b);c>f.currItem.initialZoomLevel+f.currItem.initialZoomLevel/15&&(ka=!0);var d=1,e=Ta(),g=Ua();if(c<e)if(i.pinchToClose&&!ka&&t<=f.currItem.initialZoomLevel){var h=e-c,j=1-h/(e/1.2);Fa(j),Da("onPinchClose",j),ia=!0}else d=(e-c)/e,d>1&&(d=1),c=e-d*(e/3);else c>g&&(d=(c-g)/(6*e),d>1&&(d=1),c=g+d*e);d<0&&(d=0),ba=b,Gb(hb,ib,rb),na.x+=rb.x-vb.x,na.y+=rb.y-vb.y,Ma(vb,rb),pa.x=La("x",c),pa.y=La("y",c),S=c>s,s=c,Ha()}else{if(!ga)return;if(ha&&(ha=!1,Math.abs(jb.x)>=gb&&(jb.x-=_[0].x-lb.x),Math.abs(jb.y)>=gb&&(jb.y-=_[0].y-lb.y)),kb.x=hb.x,kb.y=hb.y,0===jb.x&&0===jb.y)return;if("v"===ga&&i.closeOnVerticalDrag&&!Bb()){na.y+=jb.y,pa.y+=jb.y;var k=Ib();return T=!0,Da("onVerticalDrag",k),Fa(k),void Ha()}Hb(Ea(),hb.x,hb.y),Y=!0,da=f.currItem.bounds;var l=Nb("x",jb);l||(Nb("y",jb),Na(pa),Ha())}}},Rb=function(a){if(N.isOldAndroid){if(U&&"mouseup"===a.type)return;a.type.indexOf("touch")>-1&&(clearTimeout(U),U=setTimeout(function(){U=0},600))}Da("pointerUp"),Eb(a,!1)&&a.preventDefault();var b;if(F){var c=e.arraySearch(mb,a.pointerId,"id");if(c>-1)if(b=mb.splice(c,1)[0],navigator.pointerEnabled)b.type=a.pointerType||"mouse";else{var d={4:"mouse",2:"touch",3:"pen"};b.type=d[a.pointerType],b.type||(b.type=a.pointerType||"mouse")}}var g,h=Mb(a),j=h.length;if("mouseup"===a.type&&(j=0),2===j)return _=null,!0;1===j&&Ma(lb,h[0]),0!==j||ga||fa||(b||("mouseup"===a.type?b={x:a.pageX,y:a.pageY,type:"mouse"}:a.changedTouches&&a.changedTouches[0]&&(b={x:a.changedTouches[0].pageX,y:a.changedTouches[0].pageY,type:"touch"})),Da("touchRelease",a,b));var k=-1;if(0===j&&(V=!1,e.unbind(window,p,f),zb(),aa?k=0:sb!==-1&&(k=Ea()-sb)),sb=1===j?Ea():-1,g=k!==-1&&k<150?"zoom":"swipe",aa&&j<2&&(aa=!1,1===j&&(g="zoomPointerUp"),Da("zoomGestureEnded")),_=null,Y||X||fa||T)if(cb(),R||(R=Sb()),R.calculateSwipeSpeed("x"),T){var l=Ib();if(l<i.verticalDragRange)f.close();else{var m=pa.y,n=ja;db("verticalDrag",0,1,300,e.easing.cubic.out,function(a){pa.y=(f.currItem.initialPosition.y-m)*a+m,Fa((1-n)*a+n),Ha()}),Da("onVerticalDrag",1)}}else{if(($||fa)&&0===j){var o=Ub(g,R);if(o)return;g="zoomPointerUp"}if(!fa)return"swipe"!==g?void Wb():void(!$&&s>f.currItem.fitRatio&&Tb(R))}},Sb=function(){var a,b,c={lastFlickOffset:{},lastFlickDist:{},lastFlickSpeed:{},slowDownRatio:{},slowDownRatioReverse:{},speedDecelerationRatio:{},speedDecelerationRatioAbs:{},distanceOffset:{},backAnimDestination:{},backAnimStarted:{},calculateSwipeSpeed:function(d){ob.length>1?(a=Ea()-Q+50,b=ob[ob.length-2][d]):(a=Ea()-P,b=lb[d]),c.lastFlickOffset[d]=kb[d]-b,c.lastFlickDist[d]=Math.abs(c.lastFlickOffset[d]),c.lastFlickDist[d]>20?c.lastFlickSpeed[d]=c.lastFlickOffset[d]/a:c.lastFlickSpeed[d]=0,Math.abs(c.lastFlickSpeed[d])<.1&&(c.lastFlickSpeed[d]=0),c.slowDownRatio[d]=.95,c.slowDownRatioReverse[d]=1-c.slowDownRatio[d],c.speedDecelerationRatio[d]=1},calculateOverBoundsAnimOffset:function(a,b){c.backAnimStarted[a]||(pa[a]>da.min[a]?c.backAnimDestination[a]=da.min[a]:pa[a]<da.max[a]&&(c.backAnimDestination[a]=da.max[a]),void 0!==c.backAnimDestination[a]&&(c.slowDownRatio[a]=.7,c.slowDownRatioReverse[a]=1-c.slowDownRatio[a],c.speedDecelerationRatioAbs[a]<.05&&(c.lastFlickSpeed[a]=0,c.backAnimStarted[a]=!0,db("bounceZoomPan"+a,pa[a],c.backAnimDestination[a],b||300,e.easing.sine.out,function(b){pa[a]=b,Ha()}))))},calculateAnimOffset:function(a){c.backAnimStarted[a]||(c.speedDecelerationRatio[a]=c.speedDecelerationRatio[a]*(c.slowDownRatio[a]+c.slowDownRatioReverse[a]-c.slowDownRatioReverse[a]*c.timeDiff/10),c.speedDecelerationRatioAbs[a]=Math.abs(c.lastFlickSpeed[a]*c.speedDecelerationRatio[a]),c.distanceOffset[a]=c.lastFlickSpeed[a]*c.speedDecelerationRatio[a]*c.timeDiff,pa[a]+=c.distanceOffset[a])},panAnimLoop:function(){if($a.zoomPan&&($a.zoomPan.raf=H(c.panAnimLoop),c.now=Ea(),c.timeDiff=c.now-c.lastNow,c.lastNow=c.now,c.calculateAnimOffset("x"),c.calculateAnimOffset("y"),Ha(),c.calculateOverBoundsAnimOffset("x"),c.calculateOverBoundsAnimOffset("y"),c.speedDecelerationRatioAbs.x<.05&&c.speedDecelerationRatioAbs.y<.05))return pa.x=Math.round(pa.x),pa.y=Math.round(pa.y),Ha(),void ab("zoomPan")}};return c},Tb=function(a){return a.calculateSwipeSpeed("y"),da=f.currItem.bounds,a.backAnimDestination={},a.backAnimStarted={},Math.abs(a.lastFlickSpeed.x)<=.05&&Math.abs(a.lastFlickSpeed.y)<=.05?(a.speedDecelerationRatioAbs.x=a.speedDecelerationRatioAbs.y=0,a.calculateOverBoundsAnimOffset("x"),a.calculateOverBoundsAnimOffset("y"),!0):(bb("zoomPan"),a.lastNow=Ea(),void a.panAnimLoop())},Ub=function(a,b){var c;fa||(qb=m);var d;if("swipe"===a){var g=kb.x-lb.x,h=b.lastFlickDist.x<10;g>fb&&(h||b.lastFlickOffset.x>20)?d=-1:g<-fb&&(h||b.lastFlickOffset.x<-20)&&(d=1)}var j;d&&(m+=d,m<0?(m=i.loop?ac()-1:0,j=!0):m>=ac()&&(m=i.loop?0:ac()-1,j=!0),j&&!i.loop||(ua+=d,ra-=d,c=!0));var k,l=ta.x*ra,n=Math.abs(l-tb.x);return c||l>tb.x==b.lastFlickSpeed.x>0?(k=Math.abs(b.lastFlickSpeed.x)>0?n/Math.abs(b.lastFlickSpeed.x):333,k=Math.min(k,400),k=Math.max(k,250)):k=333,qb===m&&(c=!1),fa=!0,Da("mainScrollAnimStart"),db("mainScroll",tb.x,l,k,e.easing.cubic.out,Ka,function(){cb(),fa=!1,qb=-1,(c||qb!==m)&&f.updateCurrItem(),Da("mainScrollAnimComplete")}),c&&f.updateCurrItem(!0),c},Vb=function(a){return 1/ca*a*t},Wb=function(){var a=s,b=Ta(),c=Ua();s<b?a=b:s>c&&(a=c);var d,g=1,h=ja;return ia&&!S&&!ka&&s<b?(f.close(),!0):(ia&&(d=function(a){Fa((g-h)*a+h)}),f.zoomTo(a,0,200,e.easing.cubic.out,d),!0)};za("Gestures",{publicMethods:{initGestures:function(){var a=function(a,b,c,d,e){A=a+b,B=a+c,C=a+d,D=e?a+e:""};F=N.pointerEvent,F&&N.touch&&(N.touch=!1),F?navigator.pointerEnabled?a("pointer","down","move","up","cancel"):a("MSPointer","Down","Move","Up","Cancel"):N.touch?(a("touch","start","move","end","cancel"),G=!0):a("mouse","down","move","up"),p=B+" "+C+" "+D,q=A,F&&!G&&(G=navigator.maxTouchPoints>1||navigator.msMaxTouchPoints>1),f.likelyTouchDevice=G,r[A]=Ob,r[B]=Pb,r[C]=Rb,D&&(r[D]=r[C]),N.touch&&(q+=" mousedown",p+=" mousemove mouseup",r.mousedown=r[A],r.mousemove=r[B],r.mouseup=r[C]),G||(i.allowPanToNext=!1)}}});var Xb,Yb,Zb,$b,_b,ac,bc,cc=function(b,c,d,g){Xb&&clearTimeout(Xb),$b=!0,Zb=!0;var h;b.initialLayout?(h=b.initialLayout,b.initialLayout=null):h=i.getThumbBoundsFn&&i.getThumbBoundsFn(m);var j=d?i.hideAnimationDuration:i.showAnimationDuration,k=function(){ab("initialZoom"),d?(f.template.removeAttribute("style"),f.bg.removeAttribute("style")):(Fa(1),c&&(c.style.display="block"),e.addClass(a,"pswp--animated-in"),Da("initialZoom"+(d?"OutEnd":"InEnd"))),g&&g(),$b=!1};if(!j||!h||void 0===h.x)return Da("initialZoom"+(d?"Out":"In")),s=b.initialZoomLevel,Ma(pa,b.initialPosition),Ha(),a.style.opacity=d?0:1,Fa(1),void(j?setTimeout(function(){k()},j):k());var n=function(){var c=l,g=!f.currItem.src||f.currItem.loadError||i.showHideOpacity;b.miniImg&&(b.miniImg.style.webkitBackfaceVisibility="hidden"),d||(s=h.w/b.w,pa.x=h.x,pa.y=h.y-K,f[g?"template":"bg"].style.opacity=.001,Ha()),bb("initialZoom"),d&&!c&&e.removeClass(a,"pswp--animated-in"),g&&(d?e[(c?"remove":"add")+"Class"](a,"pswp--animate_opacity"):setTimeout(function(){e.addClass(a,"pswp--animate_opacity")},30)),Xb=setTimeout(function(){if(Da("initialZoom"+(d?"Out":"In")),d){var f=h.w/b.w,i={x:pa.x,y:pa.y},l=s,m=ja,n=function(b){1===b?(s=f,pa.x=h.x,pa.y=h.y-M):(s=(f-l)*b+l,pa.x=(h.x-i.x)*b+i.x,pa.y=(h.y-M-i.y)*b+i.y),Ha(),g?a.style.opacity=1-b:Fa(m-b*m)};c?db("initialZoom",0,1,j,e.easing.cubic.out,n,k):(n(1),Xb=setTimeout(k,j+20))}else s=b.initialZoomLevel,Ma(pa,b.initialPosition),Ha(),Fa(1),g?a.style.opacity=1:Fa(1),Xb=setTimeout(k,j+20)},d?25:90)};n()},dc={},ec=[],fc={index:0,errorMsg:'<div class="pswp__error-msg"><a href="%url%" target="_blank">The image</a> could not be loaded.</div>',forceProgressiveLoading:!1,preload:[1,1],getNumItemsFn:function(){return Yb.length}},gc=function(){return{center:{x:0,y:0},max:{x:0,y:0},min:{x:0,y:0}}},hc=function(a,b,c){var d=a.bounds;d.center.x=Math.round((dc.x-b)/2),d.center.y=Math.round((dc.y-c)/2)+a.vGap.top,d.max.x=b>dc.x?Math.round(dc.x-b):d.center.x,d.max.y=c>dc.y?Math.round(dc.y-c)+a.vGap.top:d.center.y,d.min.x=b>dc.x?0:d.center.x,d.min.y=c>dc.y?a.vGap.top:d.center.y},ic=function(a,b,c){if(a.src&&!a.loadError){var d=!c;if(d&&(a.vGap||(a.vGap={top:0,bottom:0}),Da("parseVerticalMargin",a)),dc.x=b.x,dc.y=b.y-a.vGap.top-a.vGap.bottom,d){var e=dc.x/a.w,f=dc.y/a.h;a.fitRatio=e<f?e:f;var g=i.scaleMode;"orig"===g?c=1:"fit"===g&&(c=a.fitRatio),c>1&&(c=1),a.initialZoomLevel=c,a.bounds||(a.bounds=gc())}if(!c)return;return hc(a,a.w*c,a.h*c),d&&c===a.initialZoomLevel&&(a.initialPosition=a.bounds.center),a.bounds}return a.w=a.h=0,a.initialZoomLevel=a.fitRatio=1,a.bounds=gc(),a.initialPosition=a.bounds.center,a.bounds},jc=function(a,b,c,d,e,g){b.loadError||d&&(b.imageAppended=!0,mc(b,d,b===f.currItem&&ya),c.appendChild(d),g&&setTimeout(function(){b&&b.loaded&&b.placeholder&&(b.placeholder.style.display="none",b.placeholder=null)},500))},kc=function(a){a.loading=!0,a.loaded=!1;var b=a.img=e.createEl("pswp__img","img"),c=function(){a.loading=!1,a.loaded=!0,a.loadComplete?a.loadComplete(a):a.img=null,b.onload=b.onerror=null,b=null};return b.onload=c,b.onerror=function(){a.loadError=!0,c()},b.src=a.src,b},lc=function(a,b){if(a.src&&a.loadError&&a.container)return b&&(a.container.innerHTML=""),a.container.innerHTML=i.errorMsg.replace("%url%",a.src),!0},mc=function(a,b,c){if(a.src){b||(b=a.container.lastChild);var d=c?a.w:Math.round(a.w*a.fitRatio),e=c?a.h:Math.round(a.h*a.fitRatio);a.placeholder&&!a.loaded&&(a.placeholder.style.width=d+"px",a.placeholder.style.height=e+"px"),b.style.width=d+"px",b.style.height=e+"px"}},nc=function(){if(ec.length){for(var a,b=0;b<ec.length;b++)a=ec[b],a.holder.index===a.index&&jc(a.index,a.item,a.baseDiv,a.img,!1,a.clearPlaceholder);ec=[]}};za("Controller",{publicMethods:{lazyLoadItem:function(a){a=Aa(a);var b=_b(a);b&&(!b.loaded&&!b.loading||x)&&(Da("gettingData",a,b),b.src&&kc(b))},initController:function(){e.extend(i,fc,!0),f.items=Yb=c,_b=f.getItemAt,ac=i.getNumItemsFn,bc=i.loop,ac()<3&&(i.loop=!1),Ca("beforeChange",function(a){var b,c=i.preload,d=null===a||a>=0,e=Math.min(c[0],ac()),g=Math.min(c[1],ac());for(b=1;b<=(d?g:e);b++)f.lazyLoadItem(m+b);for(b=1;b<=(d?e:g);b++)f.lazyLoadItem(m-b)}),Ca("initialLayout",function(){f.currItem.initialLayout=i.getThumbBoundsFn&&i.getThumbBoundsFn(m)}),Ca("mainScrollAnimComplete",nc),Ca("initialZoomInEnd",nc),Ca("destroy",function(){for(var a,b=0;b<Yb.length;b++)a=Yb[b],a.container&&(a.container=null),a.placeholder&&(a.placeholder=null),a.img&&(a.img=null),a.preloader&&(a.preloader=null),a.loadError&&(a.loaded=a.loadError=!1);ec=null})},getItemAt:function(a){return a>=0&&(void 0!==Yb[a]&&Yb[a])},allowProgressiveImg:function(){return i.forceProgressiveLoading||!G||i.mouseUsed||screen.width>1200},setContent:function(a,b){i.loop&&(b=Aa(b));var c=f.getItemAt(a.index);c&&(c.container=null);var d,g=f.getItemAt(b);if(!g)return void(a.el.innerHTML="");Da("gettingData",b,g),a.index=b,a.item=g;var h=g.container=e.createEl("pswp__zoom-wrap");if(!g.src&&g.html&&(g.html.tagName?h.appendChild(g.html):h.innerHTML=g.html),lc(g),ic(g,qa),!g.src||g.loadError||g.loaded)g.src&&!g.loadError&&(d=e.createEl("pswp__img","img"),d.style.opacity=1,d.src=g.src,mc(g,d),jc(b,g,h,d,!0));else{if(g.loadComplete=function(c){if(j){if(a&&a.index===b){if(lc(c,!0))return c.loadComplete=c.img=null,ic(c,qa),Ia(c),void(a.index===m&&f.updateCurrZoomItem());c.imageAppended?!$b&&c.placeholder&&(c.placeholder.style.display="none",c.placeholder=null):N.transform&&(fa||$b)?ec.push({item:c,baseDiv:h,img:c.img,index:b,holder:a,clearPlaceholder:!0}):jc(b,c,h,c.img,fa||$b,!0)}c.loadComplete=null,c.img=null,Da("imageLoadComplete",b,c)}},e.features.transform){var k="pswp__img pswp__img--placeholder";k+=g.msrc?"":" pswp__img--placeholder--blank";var l=e.createEl(k,g.msrc?"img":"");g.msrc&&(l.src=g.msrc),mc(g,l),h.appendChild(l),g.placeholder=l}g.loading||kc(g),f.allowProgressiveImg()&&(!Zb&&N.transform?ec.push({item:g,baseDiv:h,img:g.img,index:b,holder:a}):jc(b,g,h,g.img,!0,!0))}Zb||b!==m?Ia(g):(ea=h.style,cc(g,d||g.img)),a.el.innerHTML="",a.el.appendChild(h)},cleanSlide:function(a){a.img&&(a.img.onload=a.img.onerror=null),a.loaded=a.loading=a.img=a.imageAppended=!1}}});var oc,pc={},qc=function(a,b,c){var d=document.createEvent("CustomEvent"),e={origEvent:a,target:a.target,releasePoint:b,pointerType:c||"touch"};d.initCustomEvent("pswpTap",!0,!0,e),a.target.dispatchEvent(d)};za("Tap",{publicMethods:{initTap:function(){Ca("firstTouchStart",f.onTapStart),Ca("touchRelease",f.onTapRelease),Ca("destroy",function(){pc={},oc=null})},onTapStart:function(a){a.length>1&&(clearTimeout(oc),oc=null)},onTapRelease:function(a,b){if(b&&!Y&&!W&&!_a){var c=b;if(oc&&(clearTimeout(oc),oc=null,xb(c,pc)))return void Da("doubleTap",c);if("mouse"===b.type)return void qc(a,b,"mouse");var d=a.target.tagName.toUpperCase();if("BUTTON"===d||e.hasClass(a.target,"pswp__single-tap"))return void qc(a,b);Ma(pc,c),oc=setTimeout(function(){qc(a,b),oc=null},300)}}}});var rc;za("DesktopZoom",{publicMethods:{initDesktopZoom:function(){L||(G?Ca("mouseUsed",function(){f.setupDesktopZoom()}):f.setupDesktopZoom(!0))},setupDesktopZoom:function(b){rc={};var c="wheel mousewheel DOMMouseScroll";Ca("bindEvents",function(){e.bind(a,c,f.handleMouseWheel)}),Ca("unbindEvents",function(){rc&&e.unbind(a,c,f.handleMouseWheel)}),f.mouseZoomedIn=!1;var d,g=function(){f.mouseZoomedIn&&(e.removeClass(a,"pswp--zoomed-in"),f.mouseZoomedIn=!1),s<1?e.addClass(a,"pswp--zoom-allowed"):e.removeClass(a,"pswp--zoom-allowed"),h()},h=function(){d&&(e.removeClass(a,"pswp--dragging"),d=!1)};Ca("resize",g),Ca("afterChange",g),Ca("pointerDown",function(){f.mouseZoomedIn&&(d=!0,e.addClass(a,"pswp--dragging"))}),Ca("pointerUp",h),b||g()},handleMouseWheel:function(a){if(s<=f.currItem.fitRatio)return i.modal&&(!i.closeOnScroll||_a||V?a.preventDefault():E&&Math.abs(a.deltaY)>2&&(l=!0,f.close())),!0;if(a.stopPropagation(),rc.x=0,"deltaX"in a)1===a.deltaMode?(rc.x=18*a.deltaX,rc.y=18*a.deltaY):(rc.x=a.deltaX,rc.y=a.deltaY);else if("wheelDelta"in a)a.wheelDeltaX&&(rc.x=-.16*a.wheelDeltaX),a.wheelDeltaY?rc.y=-.16*a.wheelDeltaY:rc.y=-.16*a.wheelDelta;else{if(!("detail"in a))return;rc.y=a.detail}Sa(s,!0);var b=pa.x-rc.x,c=pa.y-rc.y;(i.modal||b<=da.min.x&&b>=da.max.x&&c<=da.min.y&&c>=da.max.y)&&a.preventDefault(),f.panTo(b,c)},toggleDesktopZoom:function(b){b=b||{x:qa.x/2+sa.x,y:qa.y/2+sa.y};var c=i.getDoubleTapZoom(!0,f.currItem),d=s===c;f.mouseZoomedIn=!d,f.zoomTo(d?f.currItem.initialZoomLevel:c,b,333),e[(d?"remove":"add")+"Class"](a,"pswp--zoomed-in")}}});var sc,tc,uc,vc,wc,xc,yc,zc,Ac,Bc,Cc,Dc,Ec={history:!0,galleryUID:1},Fc=function(){return Cc.hash.substring(1)},Gc=function(){sc&&clearTimeout(sc),uc&&clearTimeout(uc)},Hc=function(){var a=Fc(),b={};if(a.length<5)return b;var c,d=a.split("&");for(c=0;c<d.length;c++)if(d[c]){var e=d[c].split("=");e.length<2||(b[e[0]]=e[1])}if(i.galleryPIDs){var f=b.pid;for(b.pid=0,c=0;c<Yb.length;c++)if(Yb[c].pid===f){b.pid=c;break}}else b.pid=parseInt(b.pid,10)-1;return b.pid<0&&(b.pid=0),b},Ic=function(){if(uc&&clearTimeout(uc),_a||V)return void(uc=setTimeout(Ic,500));vc?clearTimeout(tc):vc=!0;var a=m+1,b=_b(m);b.hasOwnProperty("pid")&&(a=b.pid);var c=yc+"&gid="+i.galleryUID+"&pid="+a;zc||Cc.hash.indexOf(c)===-1&&(Bc=!0);var d=Cc.href.split("#")[0]+"#"+c;Dc?"#"+c!==window.location.hash&&history[zc?"replaceState":"pushState"]("",document.title,d):zc?Cc.replace(d):Cc.hash=c,zc=!0,tc=setTimeout(function(){vc=!1},60)};za("History",{publicMethods:{initHistory:function(){if(e.extend(i,Ec,!0),i.history){Cc=window.location,Bc=!1,Ac=!1,zc=!1,yc=Fc(),Dc="pushState"in history,yc.indexOf("gid=")>-1&&(yc=yc.split("&gid=")[0],yc=yc.split("?gid=")[0]),Ca("afterChange",f.updateURL),Ca("unbindEvents",function(){e.unbind(window,"hashchange",f.onHashChange)});var a=function(){xc=!0,Ac||(Bc?history.back():yc?Cc.hash=yc:Dc?history.pushState("",document.title,Cc.pathname+Cc.search):Cc.hash=""),Gc()};Ca("unbindEvents",function(){l&&a()}),Ca("destroy",function(){xc||a()}),Ca("firstUpdate",function(){m=Hc().pid});var b=yc.indexOf("pid=");b>-1&&(yc=yc.substring(0,b),"&"===yc.slice(-1)&&(yc=yc.slice(0,-1))),setTimeout(function(){j&&e.bind(window,"hashchange",f.onHashChange)},40)}},onHashChange:function(){return Fc()===yc?(Ac=!0,void f.close()):void(vc||(wc=!0,f.goTo(Hc().pid),wc=!1))},updateURL:function(){Gc(),wc||(zc?sc=setTimeout(Ic,800):Ic())}}}),e.extend(f,eb)};return a});;
/*! PhotoSwipe Default UI - 4.1.2 - 2017-04-05
* http://photoswipe.com
* Copyright (c) 2017 Dmitry Semenov; */
!function(a,b){"function"==typeof define&&define.amd?define(b):"object"==typeof exports?module.exports=b():a.PhotoSwipeUI_Default=b()}(this,function(){"use strict";var a=function(a,b){var c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v=this,w=!1,x=!0,y=!0,z={barsSize:{top:44,bottom:"auto"},closeElClasses:["item","caption","zoom-wrap","ui","top-bar"],timeToIdle:4e3,timeToIdleOutside:1e3,loadingIndicatorDelay:1e3,addCaptionHTMLFn:function(a,b){return a.title?(b.children[0].innerHTML=a.title,!0):(b.children[0].innerHTML="",!1)},closeEl:!0,captionEl:!0,fullscreenEl:!0,zoomEl:!0,shareEl:!0,counterEl:!0,arrowEl:!0,preloaderEl:!0,tapToClose:!1,tapToToggleControls:!0,clickToCloseNonZoomable:!0,shareButtons:[{id:"facebook",label:"Share on Facebook",url:"https://www.facebook.com/sharer/sharer.php?u={{url}}"},{id:"twitter",label:"Tweet",url:"https://twitter.com/intent/tweet?text={{text}}&url={{url}}"},{id:"pinterest",label:"Pin it",url:"http://www.pinterest.com/pin/create/button/?url={{url}}&media={{image_url}}&description={{text}}"},{id:"download",label:"Download image",url:"{{raw_image_url}}",download:!0}],getImageURLForShare:function(){return a.currItem.src||""},getPageURLForShare:function(){return window.location.href},getTextForShare:function(){return a.currItem.title||""},indexIndicatorSep:" / ",fitControlsWidth:1200},A=function(a){if(r)return!0;a=a||window.event,q.timeToIdle&&q.mouseUsed&&!k&&K();for(var c,d,e=a.target||a.srcElement,f=e.getAttribute("class")||"",g=0;g<S.length;g++)c=S[g],c.onTap&&f.indexOf("pswp__"+c.name)>-1&&(c.onTap(),d=!0);if(d){a.stopPropagation&&a.stopPropagation(),r=!0;var h=b.features.isOldAndroid?600:30;s=setTimeout(function(){r=!1},h)}},B=function(){return!a.likelyTouchDevice||q.mouseUsed||screen.width>q.fitControlsWidth},C=function(a,c,d){b[(d?"add":"remove")+"Class"](a,"pswp__"+c)},D=function(){var a=1===q.getNumItemsFn();a!==p&&(C(d,"ui--one-slide",a),p=a)},E=function(){C(i,"share-modal--hidden",y)},F=function(){return y=!y,y?(b.removeClass(i,"pswp__share-modal--fade-in"),setTimeout(function(){y&&E()},300)):(E(),setTimeout(function(){y||b.addClass(i,"pswp__share-modal--fade-in")},30)),y||H(),!1},G=function(b){b=b||window.event;var c=b.target||b.srcElement;return a.shout("shareLinkClick",b,c),!!c.href&&(!!c.hasAttribute("download")||(window.open(c.href,"pswp_share","scrollbars=yes,resizable=yes,toolbar=no,location=yes,width=550,height=420,top=100,left="+(window.screen?Math.round(screen.width/2-275):100)),y||F(),!1))},H=function(){for(var a,b,c,d,e,f="",g=0;g<q.shareButtons.length;g++)a=q.shareButtons[g],c=q.getImageURLForShare(a),d=q.getPageURLForShare(a),e=q.getTextForShare(a),b=a.url.replace("{{url}}",encodeURIComponent(d)).replace("{{image_url}}",encodeURIComponent(c)).replace("{{raw_image_url}}",c).replace("{{text}}",encodeURIComponent(e)),f+='<a href="'+b+'" target="_blank" class="pswp__share--'+a.id+'"'+(a.download?"download":"")+">"+a.label+"</a>",q.parseShareButtonOut&&(f=q.parseShareButtonOut(a,f));i.children[0].innerHTML=f,i.children[0].onclick=G},I=function(a){for(var c=0;c<q.closeElClasses.length;c++)if(b.hasClass(a,"pswp__"+q.closeElClasses[c]))return!0},J=0,K=function(){clearTimeout(u),J=0,k&&v.setIdle(!1)},L=function(a){a=a?a:window.event;var b=a.relatedTarget||a.toElement;b&&"HTML"!==b.nodeName||(clearTimeout(u),u=setTimeout(function(){v.setIdle(!0)},q.timeToIdleOutside))},M=function(){q.fullscreenEl&&!b.features.isOldAndroid&&(c||(c=v.getFullscreenAPI()),c?(b.bind(document,c.eventK,v.updateFullscreen),v.updateFullscreen(),b.addClass(a.template,"pswp--supports-fs")):b.removeClass(a.template,"pswp--supports-fs"))},N=function(){q.preloaderEl&&(O(!0),l("beforeChange",function(){clearTimeout(o),o=setTimeout(function(){a.currItem&&a.currItem.loading?(!a.allowProgressiveImg()||a.currItem.img&&!a.currItem.img.naturalWidth)&&O(!1):O(!0)},q.loadingIndicatorDelay)}),l("imageLoadComplete",function(b,c){a.currItem===c&&O(!0)}))},O=function(a){n!==a&&(C(m,"preloader--active",!a),n=a)},P=function(a){var c=a.vGap;if(B()){var g=q.barsSize;if(q.captionEl&&"auto"===g.bottom)if(f||(f=b.createEl("pswp__caption pswp__caption--fake"),f.appendChild(b.createEl("pswp__caption__center")),d.insertBefore(f,e),b.addClass(d,"pswp__ui--fit")),q.addCaptionHTMLFn(a,f,!0)){var h=f.clientHeight;c.bottom=parseInt(h,10)||44}else c.bottom=g.top;else c.bottom="auto"===g.bottom?0:g.bottom;c.top=g.top}else c.top=c.bottom=0},Q=function(){q.timeToIdle&&l("mouseUsed",function(){b.bind(document,"mousemove",K),b.bind(document,"mouseout",L),t=setInterval(function(){J++,2===J&&v.setIdle(!0)},q.timeToIdle/2)})},R=function(){l("onVerticalDrag",function(a){x&&a<.95?v.hideControls():!x&&a>=.95&&v.showControls()});var a;l("onPinchClose",function(b){x&&b<.9?(v.hideControls(),a=!0):a&&!x&&b>.9&&v.showControls()}),l("zoomGestureEnded",function(){a=!1,a&&!x&&v.showControls()})},S=[{name:"caption",option:"captionEl",onInit:function(a){e=a}},{name:"share-modal",option:"shareEl",onInit:function(a){i=a},onTap:function(){F()}},{name:"button--share",option:"shareEl",onInit:function(a){h=a},onTap:function(){F()}},{name:"button--zoom",option:"zoomEl",onTap:a.toggleDesktopZoom},{name:"counter",option:"counterEl",onInit:function(a){g=a}},{name:"button--close",option:"closeEl",onTap:a.close},{name:"button--arrow--left",option:"arrowEl",onTap:a.prev},{name:"button--arrow--right",option:"arrowEl",onTap:a.next},{name:"button--fs",option:"fullscreenEl",onTap:function(){c.isFullscreen()?c.exit():c.enter()}},{name:"preloader",option:"preloaderEl",onInit:function(a){m=a}}],T=function(){var a,c,e,f=function(d){if(d)for(var f=d.length,g=0;g<f;g++){a=d[g],c=a.className;for(var h=0;h<S.length;h++)e=S[h],c.indexOf("pswp__"+e.name)>-1&&(q[e.option]?(b.removeClass(a,"pswp__element--disabled"),e.onInit&&e.onInit(a)):b.addClass(a,"pswp__element--disabled"))}};f(d.children);var g=b.getChildByClass(d,"pswp__top-bar");g&&f(g.children)};v.init=function(){b.extend(a.options,z,!0),q=a.options,d=b.getChildByClass(a.scrollWrap,"pswp__ui"),l=a.listen,R(),l("beforeChange",v.update),l("doubleTap",function(b){var c=a.currItem.initialZoomLevel;a.getZoomLevel()!==c?a.zoomTo(c,b,333):a.zoomTo(q.getDoubleTapZoom(!1,a.currItem),b,333)}),l("preventDragEvent",function(a,b,c){var d=a.target||a.srcElement;d&&d.getAttribute("class")&&a.type.indexOf("mouse")>-1&&(d.getAttribute("class").indexOf("__caption")>0||/(SMALL|STRONG|EM)/i.test(d.tagName))&&(c.prevent=!1)}),l("bindEvents",function(){b.bind(d,"pswpTap click",A),b.bind(a.scrollWrap,"pswpTap",v.onGlobalTap),a.likelyTouchDevice||b.bind(a.scrollWrap,"mouseover",v.onMouseOver)}),l("unbindEvents",function(){y||F(),t&&clearInterval(t),b.unbind(document,"mouseout",L),b.unbind(document,"mousemove",K),b.unbind(d,"pswpTap click",A),b.unbind(a.scrollWrap,"pswpTap",v.onGlobalTap),b.unbind(a.scrollWrap,"mouseover",v.onMouseOver),c&&(b.unbind(document,c.eventK,v.updateFullscreen),c.isFullscreen()&&(q.hideAnimationDuration=0,c.exit()),c=null)}),l("destroy",function(){q.captionEl&&(f&&d.removeChild(f),b.removeClass(e,"pswp__caption--empty")),i&&(i.children[0].onclick=null),b.removeClass(d,"pswp__ui--over-close"),b.addClass(d,"pswp__ui--hidden"),v.setIdle(!1)}),q.showAnimationDuration||b.removeClass(d,"pswp__ui--hidden"),l("initialZoomIn",function(){q.showAnimationDuration&&b.removeClass(d,"pswp__ui--hidden")}),l("initialZoomOut",function(){b.addClass(d,"pswp__ui--hidden")}),l("parseVerticalMargin",P),T(),q.shareEl&&h&&i&&(y=!0),D(),Q(),M(),N()},v.setIdle=function(a){k=a,C(d,"ui--idle",a)},v.update=function(){x&&a.currItem?(v.updateIndexIndicator(),q.captionEl&&(q.addCaptionHTMLFn(a.currItem,e),C(e,"caption--empty",!a.currItem.title)),w=!0):w=!1,y||F(),D()},v.updateFullscreen=function(d){d&&setTimeout(function(){a.setScrollOffset(0,b.getScrollY())},50),b[(c.isFullscreen()?"add":"remove")+"Class"](a.template,"pswp--fs")},v.updateIndexIndicator=function(){q.counterEl&&(g.innerHTML=a.getCurrentIndex()+1+q.indexIndicatorSep+q.getNumItemsFn())},v.onGlobalTap=function(c){c=c||window.event;var d=c.target||c.srcElement;if(!r)if(c.detail&&"mouse"===c.detail.pointerType){if(I(d))return void a.close();b.hasClass(d,"pswp__img")&&(1===a.getZoomLevel()&&a.getZoomLevel()<=a.currItem.fitRatio?q.clickToCloseNonZoomable&&a.close():a.toggleDesktopZoom(c.detail.releasePoint))}else if(q.tapToToggleControls&&(x?v.hideControls():v.showControls()),q.tapToClose&&(b.hasClass(d,"pswp__img")||I(d)))return void a.close()},v.onMouseOver=function(a){a=a||window.event;var b=a.target||a.srcElement;C(d,"ui--over-close",I(b))},v.hideControls=function(){b.addClass(d,"pswp__ui--hidden"),x=!1},v.showControls=function(){x=!0,w||v.update(),b.removeClass(d,"pswp__ui--hidden")},v.supportsFullscreen=function(){var a=document;return!!(a.exitFullscreen||a.mozCancelFullScreen||a.webkitExitFullscreen||a.msExitFullscreen)},v.getFullscreenAPI=function(){var b,c=document.documentElement,d="fullscreenchange";return c.requestFullscreen?b={enterK:"requestFullscreen",exitK:"exitFullscreen",elementK:"fullscreenElement",eventK:d}:c.mozRequestFullScreen?b={enterK:"mozRequestFullScreen",exitK:"mozCancelFullScreen",elementK:"mozFullScreenElement",eventK:"moz"+d}:c.webkitRequestFullscreen?b={enterK:"webkitRequestFullscreen",exitK:"webkitExitFullscreen",elementK:"webkitFullscreenElement",eventK:"webkit"+d}:c.msRequestFullscreen&&(b={enterK:"msRequestFullscreen",exitK:"msExitFullscreen",elementK:"msFullscreenElement",eventK:"MSFullscreenChange"}),b&&(b.enter=function(){return j=q.closeOnScroll,q.closeOnScroll=!1,"webkitRequestFullscreen"!==this.enterK?a.template[this.enterK]():void a.template[this.enterK](Element.ALLOW_KEYBOARD_INPUT)},b.exit=function(){return q.closeOnScroll=j,document[this.exitK]()},b.isFullscreen=function(){return document[this.elementK]}),b}};return a});;
!function(e){var a={t:"transitionend webkitTransitionEnd oTransitionEnd otransitionend MSTransitionEnd",a:"webkitAnimationEnd mozAnimationEnd oAnimationEnd oanimationend animationend"},t={en:{name:"English",gregorian:!1,months:{"short":["Jan","Feb","Mar","Apr","May","June","July","Aug","Sept","Oct","Nov","Dec"],full:["January","February","March","April","May","June","July","August","September","October","November","December"]},weekdays:{"short":["S","M","T","W","T","F","S"],full:["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]}},it:{name:"Italiano",gregorian:!0,months:{"short":["Gen","Feb","Mar","Apr","Mag","Giu","Lug","Ago","Set","Ott","Nov","Dic"],full:["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"]},weekdays:{"short":["D","L","M","M","G","V","S"],full:["Domenica","Lunedì","Martedì","Mercoledì","Giovedì","Venerdì","Sabato"]}},fr:{name:"Français",gregorian:!0,months:{"short":["Jan","Fév","Mar","Avr","Mai","Jui","Jui","Aoû","Sep","Oct","Nov","Déc"],full:["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"]},weekdays:{"short":["D","L","M","M","J","V","S"],full:["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"]}},zh:{name:"中文",gregorian:!0,months:{"short":["一月","二月","三月","四月","五月","六月","七月","八月","九月","十月","十一月","十二月"],full:["一月","二月","三月","四月","五月","六月","七月","八月","九月","十月","十一月","十二月"]},weekdays:{"short":["天","一","二","三","四","五","六"],full:["星期天","星期一","星期二","星期三","星期四","星期五","星期六"]}},ar:{name:"العَرَبِيَّة",gregorian:!1,months:{"short":["جانفي","فيفري","مارس","أفريل","ماي","جوان","جويلية","أوت","سبتمبر","أكتوبر","نوفمبر","ديسمبر"],full:["جانفي","فيفري","مارس","أفريل","ماي","جوان","جويلية","أوت","سبتمبر","أكتوبر","نوفمبر","ديسمبر"]},weekdays:{"short":["S","M","T","W","T","F","S"],full:["الأحد","الإثنين","الثلثاء","الأربعاء","الخميس","الجمعة","السبت"]}},fa:{name:"فارسی",gregorian:!1,months:{"short":["ژانویه","فووریه","مارچ","آپریل","می","جون","جولای","آگوست","سپتامبر","اکتبر","نوامبر","دسامبر"],full:["ژانویه","فووریه","مارچ","آپریل","می","جون","جولای","آگوست","سپتامبر","اکتبر","نوامبر","دسامبر"]},weekdays:{"short":["S","M","T","W","T","F","S"],full:["یکشنبه","دوشنبه","سه شنبه","چهارشنبه","پنج شنبه","جمعه","شنبه"]}},hu:{name:"Hungarian",gregorian:!0,months:{"short":["jan","feb","már","ápr","máj","jún","júl","aug","sze","okt","nov","dec"],full:["január","február","március","április","május","június","július","augusztus","szeptember","október","november","december"]},weekdays:{"short":["v","h","k","s","c","p","s"],full:["vasárnap","hétfő","kedd","szerda","csütörtök","péntek","szombat"]}},gr:{name:"Ελληνικά",gregorian:!0,months:{"short":["Ιαν","Φεβ","Μάρ","Απρ","Μάι","Ιούν","Ιούλ","Αύγ","Σεπ","Οκτ","Νοέ","Δεκ"],full:["Ιανουάριος","Φεβρουάριος","Μάρτιος","Απρίλιος","Μάιος","Ιούνιος","Ιούλιος","Αύγουστος","Σεπτέμβριος","Οκτώβριος","Νοέμβριος","Δεκέμβριος"]},weekdays:{"short":["Κ","Δ","Τ","Τ","Π","Π","Σ"],full:["Κυριακή","Δευτέρα","Τρίτη","Τετάρτη","Πέμπτη","Παρασκευή","Σάββατο"]}},es:{name:"Español",gregorian:!0,months:{"short":["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"],full:["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]},weekdays:{"short":["D","L","M","X","J","V","S"],full:["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"]}},da:{name:"Dansk",gregorian:!0,months:{"short":["jan","feb","mar","apr","maj","jun","jul","aug","sep","okt","nov","dec"],full:["januar","februar","marts","april","maj","juni","juli","august","september","oktober","november","december"]},weekdays:{"short":["s","m","t","o","t","f","l"],full:["søndag","mandag","tirsdag","onsdag","torsdag","fredag","lørdag"]}},de:{name:"Deutsch",gregorian:!0,months:{"short":["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"],full:["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"]},weekdays:{"short":["S","M","D","M","D","F","S"],full:["Sonntag","Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag"]}},nl:{name:"Nederlands",gregorian:!0,months:{"short":["jan","feb","maa","apr","mei","jun","jul","aug","sep","okt","nov","dec"],full:["januari","februari","maart","april","mei","juni","juli","augustus","september","oktober","november","december"]},weekdays:{"short":["z","m","d","w","d","v","z"],full:["zondag","maandag","dinsdag","woensdag","donderdag","vrijdag","zaterdag"]}},pl:{name:"język polski",gregorian:!0,months:{"short":["sty","lut","mar","kwi","maj","cze","lip","sie","wrz","paź","lis","gru"],full:["styczeń","luty","marzec","kwiecień","maj","czerwiec","lipiec","sierpień","wrzesień","październik","listopad","grudzień"]},weekdays:{"short":["n","p","w","ś","c","p","s"],full:["niedziela","poniedziałek","wtorek","środa","czwartek","piątek","sobota"]}},pt:{name:"Português",gregorian:!0,months:{"short":["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"],full:["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"]},weekdays:{"short":["D","S","T","Q","Q","S","S"],full:["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"]}},si:{name:"Slovenščina",gregorian:!0,months:{"short":["jan","feb","mar","apr","maj","jun","jul","avg","sep","okt","nov","dec"],full:["januar","februar","marec","april","maj","junij","julij","avgust","september","oktober","november","december"]},weekdays:{"short":["n","p","t","s","č","p","s"],full:["nedelja","ponedeljek","torek","sreda","četrtek","petek","sobota"]}},uk:{name:"українська мова",gregorian:!0,months:{"short":["січень","лютий","березень","квітень","травень","червень","липень","серпень","вересень","жовтень","листопад","грудень"],full:["січень","лютий","березень","квітень","травень","червень","липень","серпень","вересень","жовтень","листопад","грудень"]},weekdays:{"short":["н","п","в","с","ч","п","с"],full:["неділя","понеділок","вівторок","середа","четвер","п'ятниця","субота"]}},ru:{name:"русский язык",gregorian:!0,months:{"short":["январь","февраль","март","апрель","май","июнь","июль","август","сентябрь","октябрь","ноябрь","декабрь"],full:["январь","февраль","март","апрель","май","июнь","июль","август","сентябрь","октябрь","ноябрь","декабрь"]},weekdays:{"short":["в","п","в","с","ч","п","с"],full:["воскресенье","понедельник","вторник","среда","четверг","пятница","суббота"]}},tr:{name:"Türkçe",gregorian:!0,months:{"short":["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"],full:["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"]},weekdays:{"short":["P","P","S","Ç","P","C","C"],full:["Pazar","Pazartesi","Sali","Çarşamba","Perşembe","Cuma","Cumartesi"]}},ko:{name:"조선말",gregorian:!0,months:{"short":["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"],full:["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"]},weekdays:{"short":["일","월","화","수","목","금","토"],full:["일요일","월요일","화요일","수요일","목요일","금요일","토요일"]}},fi:{name:"suomen kieli",gregorian:!0,months:{"short":["Tam","Hel","Maa","Huh","Tou","Kes","Hei","Elo","Syy","Lok","Mar","Jou"],full:["Tammikuu","Helmikuu","Maaliskuu","Huhtikuu","Toukokuu","Kesäkuu","Heinäkuu","Elokuu","Syyskuu","Lokakuu","Marraskuu","Joulukuu"]},weekdays:{"short":["S","M","T","K","T","P","L"],full:["Sunnuntai","Maanantai","Tiistai","Keskiviikko","Torstai","Perjantai","Lauantai"]}},vi:{name:"Tiếng việt",gregorian:!1,months:{"short":["Th.01","Th.02","Th.03","Th.04","Th.05","Th.06","Th.07","Th.08","Th.09","Th.10","Th.11","Th.12"],full:["Tháng 01","Tháng 02","Tháng 03","Tháng 04","Tháng 05","Tháng 06","Tháng 07","Tháng 08","Tháng 09","Tháng 10","Tháng 11","Tháng 12"]},weekdays:{"short":["CN","T2","T3","T4","T5","T6","T7"],full:["Chủ nhật","Thứ hai","Thứ ba","Thứ tư","Thứ năm","Thứ sáu","Thứ bảy"]}}},n={},r=null,l=!1,s=null,d=null,u=null,c=!1,k=function(){return/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)?!0:!1},p=function(){r&&n[r.id].fx&&!n[r.id].fxmobile&&(e(window).width()<480?r.element.removeClass("picker-fxs"):r.element.addClass("picker-fxs"))},m=function(){return n[r.id].jump>=n[r.id].key.y.max-n[r.id].key.y.min?!1:!0},g=function(){var e=A(w()),a=A(v());if(n[r.id].lock){if("from"==n[r.id].lock)return a>e?(Q(),r.element.addClass("picker-lkd"),!0):(r.element.removeClass("picker-lkd"),!1);if("to"==n[r.id].lock)return e>a?(Q(),r.element.addClass("picker-lkd"),!0):(r.element.removeClass("picker-lkd"),!1)}return n[r.id].disabledays?-1!=n[r.id].disabledays.indexOf(e)?(Q(),r.element.addClass("picker-lkd"),!0):(r.element.removeClass("picker-lkd"),!1):void 0},h=function(e){return e%1===0},f=function(e){var a=/(^\d{1,4}[\.|\\/|-]\d{1,2}[\.|\\/|-]\d{1,4})(\s*(?:0?[1-9]:[0-5]|1(?=[012])\d:[0-5])\d\s*[ap]m)?$/;return a.test(e)},y=function(e){return parseInt(n[r.id].key[e].current)},b=function(e){return parseInt(n[r.id].key[e].today)},v=function(){return b("m")+"/"+b("d")+"/"+b("y")},w=function(){return y("m")+"/"+y("d")+"/"+y("y")},T=function(e,a){for(var i=[],t=n[r.id].key[e],l=t.min;l<=t.max;l++)l%a==0&&i.push(l);return i},M=function(e,a){for(var i=a[0],t=Math.abs(e-i),n=0;n<a.length;n++){var r=Math.abs(e-a[n]);t>r&&(t=r,i=a[n])}return i},C=function(e,a){var i=n[r.id].key[e];return a>i.max?C(e,a-i.max+(i.min-1)):a<i.min?C(e,a+1+(i.max-i.min)):a},j=function(){return t[n[r.id].lang].gregorian?[1,2,3,4,5,6,0]:[0,1,2,3,4,5,6]},D=function(e){return z('ul.pick[data-k="'+e+'"]')},S=function(a,i){ul=D(a);var t=[];return ul.find("li").each(function(){t.push(e(this).attr("value"))}),"last"==i?t[t.length-1]:t[0]},z=function(e){return r?r.element.find(e):void 0},A=function(e){return Date.parse(e)/1e3},x=function(){n[r.id].large&&(r.element.toggleClass("picker-lg"),Y())},J=function(){z("ul.pick.pick-l").toggleClass("visible")},F=function(){if(!r.element.hasClass("picker-modal")){var e=r.input,a=e.offset().left+e.outerWidth()/2,i=e.offset().top+e.outerHeight();r.element.css({left:a,top:i})}},O=function(e){n[r.id].lang=Object.keys(t)[e],E(),G()},E=function(){var a=j();z(".pick-lg .pick-lg-h li").each(function(i){e(this).html(t[n[r.id].lang].weekdays.short[a[i]])}),z("ul.pick.pick-m li").each(function(){e(this).html(t[n[r.id].lang].months.short[e(this).attr("value")-1])})},N=function(){r.element.addClass("picker-focus")},L=function(){g()||(r.element.removeClass("picker-focus"),r.element.hasClass("picker-modal")&&e(".picker-modal-overlay").addClass("tohide"),r=null),l=!1},P=function(a){var l=D(a),o=n[r.id].key[a];for(n[r.id].key[a].current=o.today<o.min&&o.min||o.today,i=o.min;i<=o.max;i++){var s=i;"m"==a&&(s=t[n[r.id].lang].months.short[i-1]),"l"==a&&(s=t[Object.keys(t)[i]].name),s+="d"==a?"<span></span>":"",e("<li>",{value:i,html:s}).appendTo(l)}e("<div>",{"class":"pick-arw pick-arw-s1 pick-arw-l",html:e("<i>",{"class":"pick-i-l"})}).appendTo(l),e("<div>",{"class":"pick-arw pick-arw-s1 pick-arw-r",html:e("<i>",{"class":"pick-i-r"})}).appendTo(l),"y"==a&&(e("<div>",{"class":"pick-arw pick-arw-s2 pick-arw-l",html:e("<i>",{"class":"pick-i-l"})}).appendTo(l),e("<div>",{"class":"pick-arw pick-arw-s2 pick-arw-r",html:e("<i>",{"class":"pick-i-r"})}).appendTo(l)),K(a,y(a))},Y=function(){var a=0,i=z(".pick-lg-b");i.find("li").empty().removeClass("pick-n pick-b pick-a pick-v pick-lk pick-sl pick-h").attr("data-value","");var l=(new Date(w()),new Date(w())),o=new Date(w()),s=function(e){var a=e.getMonth(),i=e.getFullYear(),t=i%4==0&&(i%100!=0||i%400==0);return[31,t?29:28,31,30,31,30,31,31,30,31,30,31][a]};o.setMonth(o.getMonth()-1),l.setDate(1);var d=l.getDay()-1;0>d&&(d=6),t[n[r.id].lang].gregorian&&(d--,0>d&&(d=6));for(var u=s(o)-d;u<=s(o);u++)i.find("li").eq(a).html(u).addClass("pick-b pick-n pick-h"),a++;for(var u=1;u<=s(l);u++)i.find("li").eq(a).html(u).addClass("pick-n pick-v").attr("data-value",u),a++;if(i.find("li.pick-n").length<42)for(var c=42-i.find("li.pick-n").length,u=1;c>=u;u++)i.find("li").eq(a).html(u).addClass("pick-a pick-n pick-h"),a++;n[r.id].lock&&("from"===n[r.id].lock?y("y")<=b("y")&&(y("m")==b("m")?z('.pick-lg .pick-lg-b li.pick-v[data-value="'+b("d")+'"]').prevAll("li").addClass("pick-lk"):y("m")<b("m")?z(".pick-lg .pick-lg-b li").addClass("pick-lk"):y("m")>b("m")&&y("y")<b("y")&&z(".pick-lg .pick-lg-b li").addClass("pick-lk")):y("y")>=b("y")&&(y("m")==b("m")?z('.pick-lg .pick-lg-b li.pick-v[data-value="'+b("d")+'"]').nextAll("li").addClass("pick-lk"):y("m")>b("m")?z(".pick-lg .pick-lg-b li").addClass("pick-lk"):y("m")<b("m")&&y("y")>b("y")&&z(".pick-lg .pick-lg-b li").addClass("pick-lk"))),n[r.id].disabledays&&e.each(n[r.id].disabledays,function(e,a){if(a&&f(a)){var i=new Date(1e3*a);i.getMonth()+1==y("m")&&i.getFullYear()==y("y")&&z('.pick-lg .pick-lg-b li.pick-v[data-value="'+i.getDate()+'"]').addClass("pick-lk")}}),z(".pick-lg-b li.pick-v[data-value="+y("d")+"]").addClass("pick-sl")},H=function(){var a=y("m"),i=y("y"),l=i%4==0&&(i%100!=0||i%400==0);n[r.id].key.d.max=[31,l?29:28,31,30,31,30,31,31,30,31,30,31][a-1],y("d")>n[r.id].key.d.max&&(n[r.id].key.d.current=n[r.id].key.d.max,K("d",y("d"))),z(".pick-d li").removeClass("pick-wke").each(function(){var l=new Date(a+"/"+e(this).attr("value")+"/"+i).getDay();e(this).find("span").html(t[n[r.id].lang].weekdays.full[l]),(0==l||6==l)&&e(this).addClass("pick-wke")}),r.element.hasClass("picker-lg")&&(z(".pick-lg-b li").removeClass("pick-wke"),z(".pick-lg-b li.pick-v").each(function(){var t=new Date(a+"/"+e(this).attr("data-value")+"/"+i).getDay();(0==t||6==t)&&e(this).addClass("pick-wke")}))},G=function(){r.element.hasClass("picker-lg")&&Y(),H(),q()},K=function(e,a){var i=D(e);if(i.find("li").removeClass("pick-sl pick-bfr pick-afr"),a==S(e,"last")){var t=i.find('li[value="'+S(e,"first")+'"]');t.clone().insertAfter(i.find("li[value="+a+"]")),t.remove()}if(a==S(e,"first")){var t=i.find('li[value="'+S(e,"last")+'"]');t.clone().insertBefore(i.find("li[value="+a+"]")),t.remove()}i.find("li[value="+a+"]").addClass("pick-sl"),i.find("li.pick-sl").nextAll("li").addClass("pick-afr"),i.find("li.pick-sl").prevAll("li").addClass("pick-bfr")},V=function(e,a){var i=n[r.id].key[e];a>i.max&&("d"==e&&I("m","right"),"m"==e&&I("y","right"),a=i.min),a<i.min&&("d"==e&&I("m","left"),"m"==e&&I("y","left"),a=i.max),n[r.id].key[e].current=a,K(e,a)},I=function(e,a){var i=y(e);"right"==a?i++:i--,V(e,i)},Q=function(){r.element.addClass("picker-rmbl")},W=function(e){return 10>e?"0"+e:e},B=function(e){var a=["th","st","nd","rd"],i=e%100;return e+(a[(i-20)%10]||a[i]||a[0])},q=function(){if(!g()&&l){var e=y("d"),a=y("m"),i=y("y"),o=new Date(a+"/"+e+"/"+i).getDay(),s=n[r.id].format.replace(/\b(d)\b/g,W(e)).replace(/\b(m)\b/g,W(a)).replace(/\b(S)\b/g,B(e)).replace(/\b(Y)\b/g,i).replace(/\b(U)\b/g,A(w())).replace(/\b(D)\b/g,t[n[r.id].lang].weekdays.short[o]).replace(/\b(l)\b/g,t[n[r.id].lang].weekdays.full[o]).replace(/\b(F)\b/g,t[n[r.id].lang].months.full[a-1]).replace(/\b(M)\b/g,t[n[r.id].lang].months.short[a-1]).replace(/\b(n)\b/g,a).replace(/\b(j)\b/g,e);r.input.val(s).change(),l=!1}};if(k())var U={i:"touchstart",m:"touchmove",e:"touchend"};else var U={i:"mousedown",m:"mousemove",e:"mouseup"};var X="div.datedropper.picker-focus";e(document).on("click",function(e){r&&(r.input.is(e.target)||r.element.is(e.target)||0!==r.element.has(e.target).length||(L(),s=null))}).on(a.a,X+".picker-rmbl",function(){r.element.hasClass("picker-rmbl")&&e(this).removeClass("picker-rmbl")}).on(a.t,".picker-modal-overlay",function(){e(this).remove()}).on(U.i,X+" .pick-lg li.pick-v",function(){z(".pick-lg-b li").removeClass("pick-sl"),e(this).addClass("pick-sl"),n[r.id].key.d.current=e(this).attr("data-value"),K("d",e(this).attr("data-value")),l=!0}).on("click",X+" .pick-btn-sz",function(){x()}).on("click",X+" .pick-btn-lng",function(){J()}).on(U.i,X+" .pick-arw.pick-arw-s2",function(a){a.preventDefault(),s=null;var i,t=(e(this).closest("ul").data("k"),n[r.id].jump);i=e(this).hasClass("pick-arw-r")?y("y")+t:y("y")-t;var o=T("y",t);i>o[o.length-1]&&(i=o[0]),i<o[0]&&(i=o[o.length-1]),n[r.id].key.y.current=i,K("y",y("y")),l=!0}).on(U.i,X+" .pick-arw.pick-arw-s1",function(a){a.preventDefault(),s=null;var i=e(this).closest("ul").data("k");e(this).hasClass("pick-arw-r")?I(i,"right"):I(i,"left"),l=!0}).on(U.i,X+" ul.pick.pick-y li",function(){c=!0}).on(U.e,X+" ul.pick.pick-y li",function(){if(c&&m()){e(this).closest("ul").toggleClass("pick-jump");var a=M(y("y"),T("y",n[r.id].jump));n[r.id].key.y.current=a,K("y",y("y")),c=!1}}).on(U.i,X+" ul.pick.pick-d li",function(){c=!0}).on(U.e,X+" ul.pick.pick-d li",function(){c&&(x(),c=!1)}).on(U.i,X+" ul.pick.pick-l li",function(){c=!0}).on(U.e,X+" ul.pick.pick-l li",function(){c&&(J(),O(e(this).val()),c=!1)}).on(U.i,X+" ul.pick",function(a){if(s=e(this)){var i=s.data("k");d=k()?a.originalEvent.touches[0].pageY:a.pageY,u=y(i)}}).on(U.m,function(e){if(c=!1,s){e.preventDefault();var a=s.data("k");o=k()?e.originalEvent.touches[0].pageY:e.pageY,o=d-o,o=Math.round(.026*o),i=u+o;var t=C(a,i);t!=n[r.id].key[a].current&&V(a,t),l=!0}}).on(U.e,function(){s&&(s=null,d=null,u=null),r&&G()}).on(U.i,X+" .pick-submit",function(){L()}),e(window).resize(function(){r&&(F(),p())}),e.fn.dateDropper=function(){return e(this).each(function(){if(e(this).is("input")&&!e(this).hasClass("picker-input")){var a=e(this),i="datedropper-"+Object.keys(n).length;a.attr("data-id",i).addClass("picker-input").prop({type:"text",readonly:!0});var o=a.data("default-date")&&f(a.data("default-date"))?a.data("default-date"):null,s=a.data("disabled-days")?a.data("disabled-days").split(","):null,d=a.data("format")||"m/d/Y",u=a.data("fx")===!1?a.data("fx"):!0,c=a.data("fx")===!1?"":"picker-fxs",k=a.data("fx-mobile")===!1?a.data("fx-mobile"):!0,p=a.data("init-set")===!1?!1:!0,m=a.data("lang")&&a.data("lang")in t?a.data("lang"):"en",g=a.data("large-mode")===!0?!0:!1,y=a.data("large-default")===!0&&g===!0?"picker-lg":"",b="from"==a.data("lock")||"to"==a.data("lock")?a.data("lock"):!1,v=a.data("jump")&&h(a.data("jump"))?a.data("jump"):10,w=a.data("max-year")&&h(a.data("max-year"))?a.data("max-year"):(new Date).getFullYear(),T=a.data("min-year")&&h(a.data("min-year"))?a.data("min-year"):1970,M=a.data("modal")===!0?"picker-modal":"",C=a.data("theme")||"primary",D=a.data("translate-mode")===!0?!0:!1;if(s&&e.each(s,function(e,a){a&&f(a)&&(s[e]=A(a))}),n[i]={disabledays:s,format:d,fx:u,fxmobile:k,lang:m,large:g,lock:b,jump:v,key:{m:{min:1,max:12,current:1,today:(new Date).getMonth()+1},d:{min:1,max:31,current:1,today:(new Date).getDate()},y:{min:T,max:w,current:T,today:(new Date).getFullYear()},l:{min:0,max:Object.keys(t).length-1,current:0,today:0}},translate:D},o){var S=/\d+/g,x=o,J=x.match(S);e.each(J,function(e,a){J[e]=parseInt(a)}),n[i].key.m.today=J[0]&&J[0]<=12?J[0]:n[i].key.m.today,n[i].key.d.today=J[1]&&J[1]<=31?J[1]:n[i].key.d.today,n[i].key.y.today=J[2]?J[2]:n[i].key.y.today,n[i].key.y.today>n[i].key.y.max&&(n[i].key.y.max=n[i].key.y.today),n[i].key.y.today<n[i].key.y.min&&(n[i].key.y.min=n[i].key.y.today)}e("<div>",{"class":"datedropper "+M+" "+C+" "+c+" "+y,id:i,html:e("<div>",{"class":"picker"})}).appendTo("body"),r={id:i,input:a,element:e("#"+i)};for(var F in n[i].key)e("<ul>",{"class":"pick pick-"+F,"data-k":F}).appendTo(z(".picker")),P(F);if(n[i].large){e("<div>",{"class":"pick-lg"}).insertBefore(z(".pick-d")),e('<ul class="pick-lg-h"></ul><ul class="pick-lg-b"></ul>').appendTo(z(".pick-lg"));for(var O=j(),E=0;7>E;E++)e("<li>",{html:t[n[r.id].lang].weekdays.short[O[E]]}).appendTo(z(".pick-lg .pick-lg-h"));for(var E=0;42>E;E++)e("<li>").appendTo(z(".pick-lg .pick-lg-b"))}e("<div>",{"class":"pick-btns"}).appendTo(z(".picker")),e("<div>",{"class":"pick-submit"}).appendTo(z(".pick-btns")),n[r.id].translate&&e("<div>",{"class":"pick-btn pick-btn-lng"}).appendTo(z(".pick-btns")),n[r.id].large&&e("<div>",{"class":"pick-btn pick-btn-sz"}).appendTo(z(".pick-btns")),("Y"==d||"m"==d)&&(z(".pick-d,.pick-btn-sz").hide(),r.element.addClass("picker-tiny"),"Y"==d&&z(".pick-m,.pick-btn-lng").hide(),"m"==d&&z(".pick-y").hide()),p&&(l=!0,q()),r=null}}).focus(function(a){a.preventDefault(),e(this).blur(),r&&L(),r={id:e(this).data("id"),input:e(this),element:e("#"+e(this).data("id"))},p(),F(),G(),N(),r.element.hasClass("picker-modal")&&e("body").append('<div class="picker-modal-overlay"></div>')})}}(jQuery);;
/*! responsive-nav.js 1.0.39
 * https://github.com/viljamis/responsive-nav.js
 * http://responsive-nav.com
 *
 * Copyright (c) 2015 @viljamis
 * Available under the MIT license
 */

/* global Event */
(function (document, window, index) {
    // Index is used to keep multiple navs on the same page namespaced

    "use strict";

    var responsiveNav = function (el, options) {

        var computed = !!window.getComputedStyle;

        /**
         * getComputedStyle polyfill for old browsers
         */
        if (!computed) {
            window.getComputedStyle = function(el) {
                this.el = el;
                this.getPropertyValue = function(prop) {
                    var re = /(\-([a-z]){1})/g;
                    if (prop === "float") {
                        prop = "styleFloat";
                    }
                    if (re.test(prop)) {
                        prop = prop.replace(re, function () {
                            return arguments[2].toUpperCase();
                        });
                    }
                    return el.currentStyle[prop] ? el.currentStyle[prop] : null;
                };
                return this;
            };
        }
        /* exported addEvent, removeEvent, getChildren, setAttributes, addClass, removeClass, forEach */

        /**
         * Add Event
         * fn arg can be an object or a function, thanks to handleEvent
         * read more at: http://www.thecssninja.com/javascript/handleevent
         *
         * @param  {element}  element
         * @param  {event}    event
         * @param  {Function} fn
         * @param  {boolean}  bubbling
         */
        var addEvent = function (el, evt, fn, bubble) {
                if ("addEventListener" in el) {
                    // BBOS6 doesn't support handleEvent, catch and polyfill
                    try {
                        el.addEventListener(evt, fn, bubble);
                    } catch (e) {
                        if (typeof fn === "object" && fn.handleEvent) {
                            el.addEventListener(evt, function (e) {
                                // Bind fn as this and set first arg as event object
                                fn.handleEvent.call(fn, e);
                            }, bubble);
                        } else {
                            throw e;
                        }
                    }
                } else if ("attachEvent" in el) {
                    // check if the callback is an object and contains handleEvent
                    if (typeof fn === "object" && fn.handleEvent) {
                        el.attachEvent("on" + evt, function () {
                            // Bind fn as this
                            fn.handleEvent.call(fn);
                        });
                    } else {
                        el.attachEvent("on" + evt, fn);
                    }
                }
            },

            /**
             * Remove Event
             *
             * @param  {element}  element
             * @param  {event}    event
             * @param  {Function} fn
             * @param  {boolean}  bubbling
             */
            removeEvent = function (el, evt, fn, bubble) {
                if ("removeEventListener" in el) {
                    try {
                        el.removeEventListener(evt, fn, bubble);
                    } catch (e) {
                        if (typeof fn === "object" && fn.handleEvent) {
                            el.removeEventListener(evt, function (e) {
                                fn.handleEvent.call(fn, e);
                            }, bubble);
                        } else {
                            throw e;
                        }
                    }
                } else if ("detachEvent" in el) {
                    if (typeof fn === "object" && fn.handleEvent) {
                        el.detachEvent("on" + evt, function () {
                            fn.handleEvent.call(fn);
                        });
                    } else {
                        el.detachEvent("on" + evt, fn);
                    }
                }
            },

            /**
             * Get the children of any element
             *
             * @param  {element}
             * @return {array} Returns matching elements in an array
             */
            getChildren = function (e) {
                if (e.children.length < 1) {
                    throw new Error("The Nav container has no containing elements");
                }
                // Store all children in array
                var children = [];
                // Loop through children and store in array if child != TextNode
                for (var i = 0; i < e.children.length; i++) {
                    if (e.children[i].nodeType === 1) {
                        children.push(e.children[i]);
                    }
                }
                return children;
            },

            /**
             * Sets multiple attributes at once
             *
             * @param {element} element
             * @param {attrs}   attrs
             */
            setAttributes = function (el, attrs) {
                for (var key in attrs) {
                    el.setAttribute(key, attrs[key]);
                }
            },

            /**
             * Adds a class to any element
             *
             * @param {element} element
             * @param {string}  class
             */
            addClass = function (el, cls) {
                if (el.className.indexOf(cls) !== 0) {
                    el.className += " " + cls;
                    el.className = el.className.replace(/(^\s*)|(\s*$)/g,"");
                }
            },

            /**
             * Remove a class from any element
             *
             * @param  {element} element
             * @param  {string}  class
             */
            removeClass = function (el, cls) {
                var reg = new RegExp("(\\s|^)" + cls + "(\\s|$)");
                el.className = el.className.replace(reg, " ").replace(/(^\s*)|(\s*$)/g,"");
            },

            /**
             * forEach method that passes back the stuff we need
             *
             * @param  {array}    array
             * @param  {Function} callback
             * @param  {scope}    scope
             */
            forEach = function (array, callback, scope) {
                for (var i = 0; i < array.length; i++) {
                    callback.call(scope, i, array[i]);
                }
            },

            /**
             * Checks if an element has certain class
             *
             * @param  {element}  element
             * @param  {string}   class name
             * @return {Boolean}
             */
            hasClass = function (el, cls) {
                return el.className && new RegExp("(\\s|^)" + cls + "(\\s|$)").test(el.className);
            },

            /**
             * Sets or removes .focus class on an element.
             */
            toggleFocus = function () {
                var self = this,
                    menuItems = opts.menuItems;

                // Move up through the ancestors of the current link until we hit 'menu-items' class. That's top level ul-element class name.
                while ( -1 === self.className.indexOf( menuItems ) ) {

                    // On li elements toggle the class .focus.
                    if ( 'li' === self.tagName.toLowerCase() ) {
                        if ( -1 !== self.className.indexOf( 'focus' ) ) {
                            self.className = self.className.replace( ' focus', '' );
                        } else {
                            self.className += ' focus';
                        }
                    }

                    self = self.parentElement;
                }

            };

        var nav,
            opts,
            navToggle,
            styleElement = document.createElement("style"),
            htmlEl = document.documentElement,
            hasAnimFinished,
            isMobile,
            navOpen,
            dropdownButton;

        var ResponsiveNav = function (el, options) {
            var i;

            /**
             * Default options
             * @type {Object}
             */
            this.options = {
                animate: true,                    // Boolean: Use CSS3 transitions, true or false
                transition: 284,                  // Integer: Speed of the transition, in milliseconds
                label: "Menu",                    // String: Label for the navigation toggle
                insert: "before",                 // String: Insert the toggle before or after the navigation
                customToggle: "",                 // Selector: Specify the ID of a custom toggle
                closeOnNavClick: false,           // Boolean: Close the navigation when one of the links are clicked
                openPos: "relative",              // String: Position of the opened nav, relative or static
                navClass: "nav-collapse",         // String: Default CSS class. If changed, you need to edit the CSS too!
                navActiveClass: "js-nav-active",  // String: Class that is added to <html> element when nav is active
                jsClass: "js",                    // String: 'JS enabled' class which is added to <html> element
                enableFocus: false,               // Boolean: Do we add 'focus' class in nav elements
                enableDropdown: false,            // Boolean: Do we use multi level dropdown
                menuItems: "menu-items",          // String: Class that is added only to top ul element
                subMenu: "sub-menu",              // String: Class that is added to sub menu ul elements
                openDropdown: "Open sub menu",    // String: Label for opening sub menu
                closeDropdown: "Close sub menu",  // String: Label for closing sub menu
                init: function(){},               // Function: Init callback
                open: function(){},               // Function: Open callback
                close: function(){},              // Function: Close callback
                resizeMobile: function(){},       // Function: Resize callback for "mobile"
                resizeDesktop: function(){}       // Function: Resize callback for "desktop"
            };

            // User defined options
            for (i in options) {
                this.options[i] = options[i];
            }

            // Adds "js" class for <html>
            addClass(htmlEl, this.options.jsClass);

            // Wrapper
            this.wrapperEl = el.replace("#", "");

            // Try selecting ID first
            if (document.getElementById(this.wrapperEl)) {
                this.wrapper = document.getElementById(this.wrapperEl);

                // If element with an ID doesn't exist, use querySelector
            } else if (document.querySelector(this.wrapperEl)) {
                this.wrapper = document.querySelector(this.wrapperEl);

                // If element doesn't exists, stop here.
            } else {
                throw new Error("The nav element you are trying to select doesn't exist");
            }

            // Inner wrapper
            this.wrapper.inner = getChildren(this.wrapper);

            // For minification
            opts = this.options;
            nav = this.wrapper;

            // Init
            this._init(this);
        };

        ResponsiveNav.prototype = {

            /**
             * Unattaches events and removes any classes that were added
             */
            destroy: function () {
                this._removeStyles();
                removeClass(nav, "closed");
                removeClass(nav, "opened");
                removeClass(nav, opts.navClass);
                removeClass(nav, opts.navClass + "-" + this.index);
                removeClass(htmlEl, opts.navActiveClass);
                nav.removeAttribute("style");
                nav.removeAttribute("aria-hidden");

                removeEvent(window, "resize", this, false);
                removeEvent(window, "focus", this, false);
                removeEvent(document.body, "touchmove", this, false);
                removeEvent(navToggle, "touchstart", this, false);
                removeEvent(navToggle, "touchend", this, false);
                removeEvent(navToggle, "mouseup", this, false);
                removeEvent(navToggle, "keyup", this, false);
                removeEvent(navToggle, "click", this, false);

                if (!opts.customToggle) {
                    navToggle.parentNode.removeChild(navToggle);
                } else {
                    navToggle.removeAttribute("aria-hidden");
                }

                if(opts.enableDropdown) {
                    var self = this;
                    forEach(dropdownButton, function (i, el) {
                        removeEvent(el, "touchstart", self, false);
                        removeEvent(el, "touchend", self, false);
                        removeEvent(el, "mouseup", self, false);
                        removeEvent(el, "keyup", self, false);
                        removeEvent(el, "click", self, false);
                    });
                }

            },

            /**
             * Toggles the navigation open/close
             */
            toggle: function () {
                if (hasAnimFinished === true) {
                    if (!navOpen) {
                        this.open();
                    } else {
                        this.close();
                    }
                }
            },

            /**
             * Opens the navigation
             */
            open: function () {
                if (!navOpen) {
                    removeClass(nav, "closed");
                    addClass(nav, "opened");
                    addClass(htmlEl, opts.navActiveClass);
                    addClass(navToggle, "active");
                    //nav.style.position = opts.openPos;
                    setAttributes(nav, {"aria-hidden": "false"});
                    setAttributes(nav, {"aria-expanded": "true"});
                    setAttributes(navToggle, {"aria-expanded": "true"});
                    navOpen = true;
                    opts.open();
                }
            },

            /**
             * Closes the navigation
             */
            close: function () {
                if (navOpen) {
                    addClass(nav, "closed");
                    removeClass(nav, "opened");
                    removeClass(htmlEl, opts.navActiveClass);
                    removeClass(navToggle, "active");
                    setAttributes(nav, {"aria-hidden": "true"});
                    setAttributes(nav, {"aria-expanded": "false"});
                    setAttributes(navToggle, {"aria-expanded": "false"});

                    // If animations are enabled, wait until they finish
                    if (opts.animate) {
                        hasAnimFinished = false;
                        setTimeout(function () {
                            //nav.style.position = "absolute";
                            hasAnimFinished = true;

                            if(opts.enableDropdown) {
                                removeClass(nav, "dropdown-active");
                                forEach(dropdownButton, function (i, el) {
                                    removeClass(el, "toggled");
                                    removeClass(el.nextSibling, "toggled"); // Remove class from sub-menu ul element.
                                });
                            }

                        }, opts.transition + 10);

                        // Animations aren't enabled, we can do these immediately
                    } else {
                        //nav.style.position = "absolute";

                        if(opts.enableDropdown) {
                            removeClass(nav, "dropdown-active");
                            forEach(dropdownButton, function (i, el) {
                                removeClass(el, "toggled");
                                removeClass(el.nextSibling, "toggled"); // Remove class from sub-menu ul element.
                            });
                        }
                    }

                    navOpen = false;
                    opts.close();
                }
            },

            /**
             * Resize is called on window resize and orientation change.
             * It initializes the CSS styles and height calculations.
             */
            resize: function () {

                // Resize watches navigation toggle's display state
                if (window.getComputedStyle(navToggle, null).getPropertyValue("display") !== "none") {

                    isMobile = true;
                    setAttributes(navToggle, {"aria-hidden": "false"});
                    setAttributes(nav, {"aria-expanded": "false"});
                    setAttributes(navToggle, {"aria-expanded": "false"});

                    // If the navigation is hidden
                    if (nav.className.match(/(^|\s)closed(\s|$)/)) {
                        setAttributes(nav, {"aria-hidden": "true"});
                        //nav.style.position = "absolute";
                    }

                    // If the navigation is not hidden
                    if (!nav.className.match(/(^|\s)closed(\s|$)/)) {
                        setAttributes(nav, {"aria-expanded": "true"});
                        setAttributes(navToggle, {"aria-expanded": "true"});
                    }

                    this._createStyles();
                    this._calcHeight();
                    opts.resizeMobile();

                } else {

                    isMobile = false;
                    setAttributes(navToggle, {"aria-hidden": "true"});
                    setAttributes(nav, {"aria-hidden": "false"});
                    nav.removeAttribute("aria-expanded");
                    navToggle.removeAttribute("aria-expanded");
                    //nav.style.position = opts.openPos;
                    this._removeStyles();
                    opts.resizeDesktop();

                }
            },

            /**
             * Takes care of all even handling
             *
             * @param  {event} event
             * @return {type} returns the type of event that should be used
             */
            handleEvent: function (e) {
                var evt = e || window.event;

                switch (evt.type) {
                    case "touchstart":
                        this._onTouchStart(evt);
                        break;
                    case "touchmove":
                        this._onTouchMove(evt);
                        break;
                    case "touchend":
                    case "mouseup":
                        this._onTouchEnd(evt);
                        break;
                    case "click":
                        this._preventDefault(evt);
                        break;
                    case "keyup":
                        this._onKeyUp(evt);
                        break;
                    case "focus":
                    case "resize":
                        this.resize(evt);
                        break;
                }
            },

            /**
             * Initializes the widget
             */
            _init: function () {
                this.index = index++;

                addClass(nav, opts.navClass);
                addClass(nav, opts.navClass + "-" + this.index);
                addClass(nav, "closed");
                hasAnimFinished = true;
                navOpen = false;

                this._closeOnNavClick();
                this._createToggle();
                this._transitions();
                this.resize();

                // Enable more accessible dropdown menu
                this._createFocus();
                this._createDropdown();

                /**
                 * On IE8 the resize event triggers too early for some reason
                 * so it's called here again on init to make sure all the
                 * calculated styles are correct.
                 */
                var self = this;
                setTimeout(function () {
                    self.resize();
                }, 20);

                addEvent(window, "resize", this, false);
                addEvent(window, "focus", this, false);
                addEvent(document.body, "touchmove", this, false);
                addEvent(navToggle, "touchstart", this, false);
                addEvent(navToggle, "touchend", this, false);
                addEvent(navToggle, "mouseup", this, false);
                addEvent(navToggle, "keyup", this, false);
                addEvent(navToggle, "click", this, false);

                /**
                 * Init callback here
                 */
                opts.init();
            },

            /**
             * Creates Styles to the <head>
             */
            _createStyles: function () {
                // if (!styleElement.parentNode) {
                //     styleElement.type = "text/css";
                //     document.getElementsByTagName("head")[0].appendChild(styleElement);
                // }
            },

            /**
             * Removes styles from the <head>
             */
            _removeStyles: function () {
                if (styleElement.parentNode) {
                    styleElement.parentNode.removeChild(styleElement);
                }
            },

            /**
             * Creates Navigation Toggle
             */
            _createToggle: function () {

                // If there's no toggle, let's create one
                if (!opts.customToggle) {
                    var toggle = document.createElement("a");
                    toggle.innerHTML = opts.label;
                    setAttributes(toggle, {
                        "href": "#",
                        "class": "nav-toggle"
                    });

                    // Determine where to insert the toggle
                    if (opts.insert === "after") {
                        nav.parentNode.insertBefore(toggle, nav.nextSibling);
                    } else {
                        nav.parentNode.insertBefore(toggle, nav);
                    }

                    navToggle = toggle;

                    // There is a toggle already, let's use that one
                } else {
                    var toggleEl = opts.customToggle.replace("#", "");

                    if (document.getElementById(toggleEl)) {
                        navToggle = document.getElementById(toggleEl);
                    } else if (document.querySelector(toggleEl)) {
                        navToggle = document.querySelector(toggleEl);
                    } else {
                        throw new Error("The custom nav toggle you are trying to select doesn't exist");
                    }
                }
            },

            /**
             * Closes the navigation when a link inside is clicked.
             */
            _closeOnNavClick: function () {
                if (opts.closeOnNavClick) {
                    var links = nav.getElementsByTagName("a"),
                        self = this;
                    forEach(links, function (i, el) {
                        addEvent(links[i], "click", function () {
                            if (isMobile) {
                                self.toggle();
                            }
                        }, false);
                    });
                }
            },

            /**
             * Prevents the default functionality.
             *
             * @param  {event} event
             */
            _preventDefault: function(e) {
                if (e.preventDefault) {
                    if (e.stopImmediatePropagation) {
                        e.stopImmediatePropagation();
                    }
                    e.preventDefault();
                    e.stopPropagation();
                    return false;

                    // This is strictly for old IE
                } else {
                    e.returnValue = false;
                }
            },

            /**
             * On touch start we get the location of the touch.
             *
             * @param  {event} event
             */
            _onTouchStart: function (e) {
                if (!Event.prototype.stopImmediatePropagation) {
                    this._preventDefault(e);
                }
                this.startX = e.touches[0].clientX;
                this.startY = e.touches[0].clientY;
                this.touchHasMoved = false;

                /**
                 * Remove mouseup event completely here to avoid
                 * double triggering the event.
                 */
                removeEvent(navToggle, "mouseup", this, false);
            },

            /**
             * Check if the user is scrolling instead of tapping.
             *
             * @param  {event} event
             */
            _onTouchMove: function (e) {
                if (Math.abs(e.touches[0].clientX - this.startX) > 10 ||
                    Math.abs(e.touches[0].clientY - this.startY) > 10) {
                    this.touchHasMoved = true;
                }
            },

            /**
             * On touch end toggle the navigation.
             *
             * @param  {event} event
             */
            _onTouchEnd: function (e) {
                this._preventDefault(e);
                if (!isMobile) {
                    return;
                }

                // Get event.target, the old IE way
                var thisEvent = e || window.event,
                    targetEl = thisEvent.target || thisEvent.srcElement,
                    isDropdownTapped = false;

                // Was it sub-navigation toggle or the main toggle?
                if (hasClass(targetEl, "dropdown-toggle-btn") && opts.enableDropdown) isDropdownTapped = true;

                // If the user isn't scrolling
                if (!this.touchHasMoved) {

                    // If the event type is touch
                    if (e.type === "touchend") {

                        // If sub-navigation toggle was tapped
                        if (isDropdownTapped) {
                            this._toggleDropdown(targetEl);

                            // If the main toggle was tapped
                        } else {
                            this.toggle();
                        }
                        return;

                        // Event type was click, not touch
                    } else {
                        var evt = e || window.event;

                        // If it isn't a right click, do toggling
                        if (!(evt.which === 3 || evt.button === 2)) {
                            if (isDropdownTapped) {
                                this._toggleDropdown(targetEl);
                            } else {
                                this.toggle();
                            }
                        }
                    }
                }
            },

            /**
             * For keyboard accessibility, toggle the navigation on Enter
             * keypress too.
             *
             * @param  {event} event
             */
            _onKeyUp: function (e) {
                var evt = e || window.event,
                    targetEl = e.target,
                    isDropdownTapped = false;

                if (hasClass(targetEl, "dropdown-toggle-btn") && opts.enableDropdown) isDropdownTapped = true;
                if (evt.keyCode === 13) {
                    if (isDropdownTapped) {
                        this._toggleDropdown(targetEl);
                    } else {
                        this.toggle();
                    }
                }
            },

            /**
             * Adds the needed CSS transitions if animations are enabled
             */
            _transitions: function () {
                if (opts.animate) {
                    var objStyle = nav.style,
                        transition = "max-height " + opts.transition + "ms, visibility " + opts.transition +  "ms linear";

                    objStyle.WebkitTransition =
                        objStyle.MozTransition =
                            objStyle.OTransition =
                                objStyle.transition = transition;
                }
            },

            /**
             * Calculates the height of the navigation and then creates
             * styles which are later added to the page <head>
             */
            _calcHeight: function () {
                var savedHeight = 0;
                for (var i = 0; i < nav.inner.length; i++) {
                    savedHeight += nav.inner[i].offsetHeight;
                }

                var innerStyles = "." + opts.jsClass + " ." + opts.navClass + "-" + this.index + ".opened{max-height:" + savedHeight + "px !important} ." + opts.jsClass + " ." + opts.navClass + "-" + this.index + ".opened.dropdown-active {max-height:9999px !important}";

                if (styleElement.styleSheet) {
                    styleElement.styleSheet.cssText = innerStyles;
                } else {
                    styleElement.innerHTML = innerStyles;
                }

                innerStyles = "";
            },

            /**
             * Creates 'focus' class on nav elements
             */
            _createFocus: function () {

                // Bail if focus is not enabled.
                if(!opts.enableFocus) {
                    return;
                }

                // Get all the link elements within the menu.
                var menu = nav.getElementsByTagName( 'ul' )[0],
                    links = menu.getElementsByTagName( 'a' ),
                    len,
                    i;

                // Each time a menu link is focused or blurred, toggle focus.
                for ( i = 0, len = links.length; i < len; i++ ) {
                    links[i].addEventListener( 'focus', toggleFocus, true );
                    links[i].addEventListener( 'blur', toggleFocus, true );
                }

            },

            /**
             * Enable multi-level dropdown
             */
            _createDropdown: function () {

                // Bail if multiple level dropdown is not enabled.
                if(!opts.enableDropdown) {
                    return;
                }

                var self = this;

                // Get submenus
                var menu = nav.getElementsByTagName( 'ul' )[0],
                    subMenus = nav.getElementsByClassName( opts.subMenu ),
                    i,
                    len;

                // Add .multiple-level-nav class to nav
                addClass(nav, 'multiple-level-nav');

                // Set menu items with sub menus to aria-haspopup="true" and add toggle button before sub menu.
                for (i = 0, len = subMenus.length; i < len; i++) {
                    subMenus[i].parentNode.setAttribute( 'aria-haspopup', 'true' );
                    subMenus[i].insertAdjacentHTML( 'beforebegin', '<button class="dropdown-toggle-btn" aria-expanded="false">' + opts.openDropdown + '</button>' );
                }

                // Select all dropdown buttons
                dropdownButton = nav.querySelectorAll( '.dropdown-toggle-btn' );

                // For each dropdown Button element add click event
                forEach( dropdownButton, function( i, el ) {
                    addEvent(el, "touchstart", self, false);
                    addEvent(el, "touchend", self, false);
                    addEvent(el, "mouseup", self, false);
                    addEvent(el, "keyup", self, false);
                    addEvent(el, "click", self, false);
                });

            },

            /**
             * Toggles sub-navigations open/closed
             *
             * @param  {element} The toggle that was tapped
             */
            _toggleDropdown: function (targetEl) {

                // Enable active class to let the navigation expand over
                // the calculated max height
                //addClass(nav, "dropdown-active");

                // Change dropdown button text on every click
                if( targetEl.innerHTML === opts.openDropdown ) {
                    targetEl.innerHTML = opts.closeDropdown;
                } else {
                    targetEl.innerHTML = opts.openDropdown;
                }

                // Check if the sub-navigation is inside another sub-nav
                var parentEl = targetEl.parentNode,
                    isInsideSub = hasClass(parentEl.parentNode.parentNode, "dropdown");

                // Toggle dropdown button
                if( !hasClass( targetEl, 'toggled' ) ) {

                    // Add .toggled class
                    addClass( targetEl, 'toggled' );

                    // Set aria-expanded to true
                    targetEl.setAttribute( 'aria-expanded', 'true' );

                    // Get next element meaning UL with .sub-menu class
                    var nextElement = targetEl.nextElementSibling;

                    // Add 'toggled' class to sub-menu element
                    addClass( nextElement, 'toggled' );

                    // Add 'dropdown-active' class to nav when dropdown is toggled
                    addClass( nav, 'dropdown-active' );

                } else {

                    // Remove .toggled class
                    removeClass( targetEl, 'toggled' );

                    // Set aria-expanded to false
                    targetEl.setAttribute( 'aria-expanded', 'false' );

                    // Get next element meaning UL with .sub-menu
                    var nextElement = targetEl.nextElementSibling;

                    // Remove 'toggled' class from sub-menu element
                    removeClass( nextElement, 'toggled' );

                    // Remove 'dropdown-active' class to nav when dropdown is toggled
                    removeClass( nav, 'dropdown-active' );

                }

            },

        };

        /**
         * Return new Responsive Nav
         */
        return new ResponsiveNav(el, options);

    };

    if (typeof module !== "undefined" && module.exports) {
        module.exports = responsiveNav;
    } else {
        window.responsiveNav = responsiveNav;
    }

}(document, window, 0));;
/**
 * @file
 * Custom scripts for theme.
 */
(function ($) {
  
  Drupal.behaviors.bootsDefault = {
    attach: function (context) {
      // do stuff.


      if (document.documentMode || /Edge/.test(navigator.userAgent)) {
        $('body').addClass('isie');
      }
      
      var imageHoverItem = document.getElementsByClassName("image-hover-item");

      var slice = [].slice;
      var removeClass = function(elem){
        elem.classList.remove('focus-within');
      };
      var update = (function(){
        var running, last;
        var action = function(){
          var element = document.activeElement;
          running = false;
          if(last !== element){
            last = element;
            slice.call(document.getElementsByClassName('focus-within')).forEach(removeClass);
            while(element && element.classList){
              element.classList.add('focus-within');
              element = element.parentNode;
            }
          }
        };
        return function(){
          if(!running){
            requestAnimationFrame(action);
            running = true;
          }
        };
      })();
      
      for(var i = 0, j=imageHoverItem.length; i<j; i++){
        imageHoverItem[i].addEventListener('focus', update, true);
        imageHoverItem[i].addEventListener('blur', update, true);
      }

      //menu
      var stickyHeaderTop = 180, menuHeight = $('#mainHeader').height();
      var isSticked = false;
        $(window).scroll(function(){
            if( $(window).scrollTop() > stickyHeaderTop ) {
                if(isSticked)
                    return;

                if($(window).width() > 991 && $('body').hasClass('page--front') ){
                    if( $('body').hasClass('page--logged-in') )
                        $('body').css('padding-top', '78px');
                    else
                        $('body').css('padding-top', 0);
                }else{
                    $('body').css('padding-top', menuHeight);
                }
                isSticked = true;

                $('#mainHeader').addClass('sticky');
            } else {
                $('#mainHeader').removeClass('sticky');
                if( $('body').hasClass('page--logged-in') )
                    $('body').css('padding-top', '78px');
                else
                    $('body').css('padding-top', 0);
                isSticked = false;
            }
        });

        var mainMenu = responsiveNav("#mainMenuBot", {
            enableFocus: true,
            animate: false,
            transition: 0,
            customToggle: '#navbar-toggle',
            enableDropdown: true,
            insert: "before",
            open: function(){
              $('.navbar-collapse.collapse').collapse('toggle');
            },
            close: function(el){
                $('.navbar-collapse.collapse').collapse('toggle');
            },
            openDropdown: '<i class="fa fa-angle-down"></i><span class="sr-only">Open sub menu</span>',
            closeDropdown: '<i class="fa fa-angle-up"></i><span class="sr-only">Close sub menu</span>'
        });

        $(".dropdown li").on('mouseenter mouseleave', function (e) {
          
          
          if ($('ul', this).length) {
              var elm = $('ul:first', this);
              var off = elm.offset();
              var l = off.left;
              var w = elm.width();
              var docH = $(window).height();
              var docW = $(window).width();
  
              var isEntirelyVisible = (l + w <= docW);
  
              if (!isEntirelyVisible) {
                  $(this).addClass('edge');
              } else {
                  $(this).removeClass('edge');
              }
          }
      });


      // tab
      $("#tabsresp").bootstrapDynamicTabs();

      // Ajout de l'url d'ouverture du panel de configuration des cookies
      // class présente dans le footer  
      $('.mes-cookies-eivp').attr('href', 'javascript:tarteaucitron.userInterface.openPanel();');

      //Close btn on popup
      $(document, context).once('bootsDefault').ready(function () {
        // Cibler le bouton de fermeture
        $('.popup-close').on('click', function () {
          // Cacher le conteneur du popup
          $('.popup-container').hide();
        });
      });


      // Btn - scrolltop
      let scrollTotopBTN = $("#scrollTotop");
      window.onscroll = function() {scrollFunction()};
      function scrollFunction() {
        if (document.body.scrollTop > 50 || document.documentElement.scrollTop > 50) {
          scrollTotopBTN.css('display', 'block');
        } else {
          scrollTotopBTN.css('display', 'none');
        }
      }
      scrollTotopBTN.click(function() {
        $("html, body").animate({ scrollTop: 0 }, "slow");
        return false;
      });
      
      $('#scrollDown').click(function() {
        let targetNextStep = $("#shortcuts").offset().top - 150;
        $("html, body").animate({ scrollTop: targetNextStep }, "slow");
        return false;
      });

      $('.gallery-carousel').each( function() {
            var $pic     = $(this),
                getItems = function() {
                    var items = [];
                    $pic.find('a').each(function() {
                      if ($(this).hasOwnProperty('size')) {
                        var $href   = $(this).attr('href'),
                        $size   = $(this).data('size').split('x'),
                            $width  = $size[0],
                            $height = $size[1];
        
                        var item = {
                          src : $href,
                            w   : $width,
                            h   : $height
                        }
                        
                        items.push(item);
                      }
                    });
                    return items;
                }
        
            var items = getItems();
            var $pswp = $('.pswp')[0];

            $pic.on('click', 'a', function(event) {
              if ($(this).hasOwnProperty('size')) {
                event.preventDefault();
                var indexImage = $(this).parent().parent().parent().index();
                var $index = $(this).index();
                var options = {
                    index: $index,
                    bgOpacity: 0.7,
                    showHideOpacity: true
                }
                
                // Initialize PhotoSwipe
                const lightBox = new PhotoSwipe($pswp, PhotoSwipeUI_Default, items, options);
                lightBox.init();
                lightBox.goTo(indexImage);
              }
            });
        });

      // function initAndGoPhotoSwipe(lightBox, indexImage) {
      //   lightBox.loadAndOpen(indexImage);
      // }


      // full width right column
      $(window).resize(function () {
        var dWidth = $(document).width();
        if( $(window).width() > 992 ){
          $('.gallery-block, .map-block').width(function(){
            return  dWidth - $('.main-content .container').offset().left - $('.main-content .container .sidebar').width() -60
          })
        }else{
          $('.gallery-block, .map-block').width('100%');
        }
      }).resize();

      //input Date Dropper
      $('input.calendar').dateDropper();



      // Search bar header
        // ToDo : on hover open the form
      $('.nav-search-trigger').on('click',function(event){
        var searchFormH = $('.nav-search-wrapper .form-wrapper');
        searchFormH.toggleClass('open');
        $('.fa',this).toggleClass('fa-times');
        if(searchFormH.hasClass('open')){
          setTimeout(function(){
            $('.nav-search-wrapper input[type=text]').focus();},100);
        }
        return false;
      });
      $('#search-focus-link').click(function (e) {
        $('.nav-search-trigger').focus();
      });


      var galleryOwl =  $(".gallery-carousel").owlCarousel({
        items : 1,
        autoplay : false,
        autoHeight:true,
        dots: false,
        nav : true,
        navText: ['<i class="fa fa-angle-left"></i>','<i class="fa fa-angle-right"></i>']
      });
      var totalItems = jQuery('.gallery-carousel .owl-item:not(.cloned)').length;
      $('<div class="owl-page-index">1 sur '+totalItems+'</div>').insertAfter('.gallery-carousel .owl-nav .owl-prev');
      galleryOwl.on('changed.owl.carousel', function(event) {
        var pos = event.relatedTarget.normalize(event.item.index, true) + 1;
        jQuery('.gallery-carousel .owl-page-index').html( pos + ' sur ' + totalItems );
      });



      if($('.home-banner .owl-carousel').length){
          homeBanner = $('.home-banner .owl-carousel').owlCarousel({
              loop: true,
              rewind: false,
              margin:0,
              items: 1,
              autoplay: true,
              nav: true,
              autoplayTimeout: 9000,
              dots: true,
              navText: ['<i class="fa fa-angle-left"></i>','<i class="fa fa-angle-right"></i>']
          })
          $('.home-banner .owl-carousel .owl-nav > div').on('click',function(){
              homeBanner.trigger('stop.owl.autoplay');
              var carousel = $('.home-banner .owl-carousel').data('owl.carousel');
              carousel.settings.autoplay = false; //don't know if both are necessary
              carousel.options.autoplay = false;
              $('.owl-carousel').trigger('refresh.owl.carousel');
          });
      }


      if($('.event-carousel').length)
        $('.event-carousel').owlCarousel({
          loop: false,
          margin: 20,
          items: 3,
          autoplay: false,
          nav: true,
          dots: false,
          navText: ['<i class="fa fa-angle-left"></i>','<i class="fa fa-angle-right"></i>'],
          responsive:{
            0:{
              items:1
            },
            680:{
              items:2,
              nav:false
            },
            1000:{
              items:3,
              nav:false
            },
            1450:{
              nav:true
            }
          }
        })

      // if($('.actu-carousel').length)
      //   $('.actu-carousel').owlCarousel({
      //     loop: true,
      //     margin: 20,
      //     items: 2,
      //     autoplay: false,
      //     nav: true,
      //     dots: false,
      //     navText: ['<i class="fa fa-angle-left"></i>','<i class="fa fa-angle-right"></i>'],
      //     responsive:{
      //       0:{
      //         items:1
      //       },
      //       780:{
      //         items:1
      //       },
      //       1000:{
      //         nav:false
      //       },
      //       1450:{
      //         nav:true
      //       }
      //     }
      //   });

      if($('.partners-carousel .owl-carousel').length)
        $('.partners-carousel .owl-carousel').owlCarousel({
          margin: 20,
          items: 4,
          nav: true,
          dots: false,
          navText: ['<i class="fa fa-angle-left"></i>','<i class="fa fa-angle-right"></i>'],
          responsive:{
            0:{
              items:1
            },
            780:{
              items:2
            },
            1450:{
              nav:true
            }
          }
        })


      if($('.social-wall .owl-carousel').length) {
        setTimeout(function(){
          $('.social-wall .owl-carousel').owlCarousel({
            margin: 20,
            items: 3,
            dots: false,
            autoHeight:true,
            navText: ['<i class="fa fa-angle-left"></i>','<i class="fa fa-angle-right"></i>'],
            responsive:{
              0:{
                items:1,
                nav: true
              },
              780:{
                items:2,
                nav: true
              },
              992:{
                items: 3,
                nav: false
              }
            }
          })
        },1000);
      }
      
    }
  }

  Drupal.behaviors.bootsActiveLinks = {
    attach: function (context) {
      // do stuff.
      $('li.active > a').on('click', function(e){
        if( $(this).hasClass('is-active') )
          e.preventDefault();
      });
    }
  }

  Drupal.behaviors.owlCarousel = {
    attach: function (context) {
      // do stuff.

      //$('.owl-carousel').owlCarousel({
      //  items: 1,
      //  loop: true
      //});
      
    }
  }

  Drupal.behaviors.miscBehaviour = {
    attach: function (context) {
      $( ".atcb-link" ).append('<i class="fa fa-calendar"></i>');
    }
  }
  
  // ScrollTo function
  $.fn.scrollTo = function() {
    plus = 100;
    body = $("body");
    if(body.hasClass("toolbar-horizontal")){
      plus += 80;
    }
    else if(body.hasClass("toolbar-vertical")){
      plus += 40;
    }
    jQuery('html,body').animate({scrollTop: $(this).offset().top - plus},'fast');
    return this;
  };
  
  // Remove radix dropdown behaviour conflicts with bootstrap dropdown buttons 
  Drupal.behaviors.radix_dropdown = {};

})(jQuery);
;
/*jslint browser: true, evil: true */

var scripts = document.getElementsByTagName('script'),
    path = scripts[scripts.length - 1].src.split('?')[0],
    tarteaucitronForceCDN = (tarteaucitronForceCDN === undefined) ? '' : tarteaucitronForceCDN,
    cdn = (tarteaucitronForceCDN === '') ? path.split('/').slice(0, -1).join('/') + '/' : tarteaucitronForceCDN,
    alreadyLaunch = (alreadyLaunch === undefined) ? 0 : alreadyLaunch,
    tarteaucitronForceLanguage = (tarteaucitronForceLanguage === undefined) ? '' : tarteaucitronForceLanguage,
    tarteaucitronForceExpire = (tarteaucitronForceExpire === undefined) ? '' : tarteaucitronForceExpire,
    tarteaucitronCustomText = (tarteaucitronCustomText === undefined) ? '' : tarteaucitronCustomText,
    // tarteaucitronExpireInDay: true for day(s) value - false for hour(s) value
    tarteaucitronExpireInDay = (tarteaucitronExpireInDay === undefined || typeof tarteaucitronExpireInDay !== "boolean") ? true : tarteaucitronExpireInDay,
    timeExpire = 31536000000,
    tarteaucitronProLoadServices,
    tarteaucitronNoAdBlocker = false;



var tarteaucitron = {
    "version": 20220322,
    "cdn": cdn,
    "user": {},
    "lang": {},
    "services": {},
    "added": [],
    "idprocessed": [],
    "state": [],
    "launch": [],
    "parameters": {},
    "isAjax": false,
    "reloadThePage": false,
    "events": {
        "init": function () {},
        "load": function () {},
    },
    "init": function (params) {
        "use strict";
        var origOpen;

        tarteaucitron.parameters = params;
        if (alreadyLaunch === 0) {
            alreadyLaunch = 1;
            if (window.addEventListener) {
                window.addEventListener("load", function () {
                    tarteaucitron.initEvents.loadEvent(false);
                }, false);
                window.addEventListener("scroll", function () {
                    tarteaucitron.initEvents.scrollEvent();
                }, false);

                window.addEventListener("keydown", function (evt) {
                    tarteaucitron.initEvents.keydownEvent(false, evt);
                }, false);
                window.addEventListener("hashchange", function () {
                    tarteaucitron.initEvents.hashchangeEvent();
                }, false);
                window.addEventListener("resize", function () {
                    tarteaucitron.initEvents.resizeEvent();
                }, false);
            } else {
                window.attachEvent("onload", function () {
                    tarteaucitron.initEvents.loadEvent(true);
                });
                window.attachEvent("onscroll", function () {
                    tarteaucitron.initEvents.scrollEvent();
                });
                window.attachEvent("onkeydown", function (evt) {
                    tarteaucitron.initEvents.keydownEvent(true, evt);

                });
                window.attachEvent("onhashchange", function () {
                    tarteaucitron.initEvents.hashchangeEvent();
                });
                window.attachEvent("onresize", function () {
                    tarteaucitron.initEvents.resizeEvent();
                });
            }

            if (typeof XMLHttpRequest !== 'undefined') {
                origOpen = XMLHttpRequest.prototype.open;
                XMLHttpRequest.prototype.open = function () {

                    if (window.addEventListener) {
                        this.addEventListener("load", function () {
                            if (typeof tarteaucitronProLoadServices === 'function') {
                                tarteaucitronProLoadServices();
                            }
                        }, false);
                    } else if (typeof this.attachEvent !== 'undefined') {
                        this.attachEvent("onload", function () {
                            if (typeof tarteaucitronProLoadServices === 'function') {
                                tarteaucitronProLoadServices();
                            }
                        });
                    } else {
                        if (typeof tarteaucitronProLoadServices === 'function') {
                            setTimeout(tarteaucitronProLoadServices, 1000);
                        }
                    }

                    try {
                        origOpen.apply(this, arguments);
                    } catch (err) {}
                };
            }
        }

        if(tarteaucitron.events.init) {
            tarteaucitron.events.init();
        }
    },
    "initEvents": {
        "loadEvent": function (isOldBrowser) {
            tarteaucitron.load();
            tarteaucitron.fallback(['tarteaucitronOpenPanel'], function (elem) {
                if (isOldBrowser) {
                    elem.attachEvent("onclick", function (event) {
                        tarteaucitron.userInterface.openPanel();
                        event.preventDefault();
                    });
                } else {
                    elem.addEventListener("click", function (event) {
                        tarteaucitron.userInterface.openPanel();
                        event.preventDefault();
                    }, false);
                }
            }, true);
        },
        "keydownEvent": function (isOldBrowser, evt) {
            if (evt.keyCode === 27) {
                tarteaucitron.userInterface.closePanel();
            }

            if (isOldBrowser) {
                if ( evt.keyCode === 9 && focusableEls.indexOf(evt.target) >= 0) {
                    if ( evt.shiftKey ) /* shift + tab */ {
                        if (document.activeElement === firstFocusableEl) {
                            lastFocusableEl.focus();
                            evt.preventDefault();
                        }
                    } else /* tab */ {
                        if (document.activeElement === lastFocusableEl) {
                            firstFocusableEl.focus();
                            evt.preventDefault();
                        }
                    }
                }
            }
        },
        "hashchangeEvent": function () {
            if (document.location.hash === tarteaucitron.hashtag && tarteaucitron.hashtag !== '') {
                tarteaucitron.userInterface.openPanel();
            }
        },
        "resizeEvent": function () {
            var tacElem = document.getElementById('tarteaucitron');
            var tacCookieContainer = document.getElementById('tarteaucitronCookiesListContainer');

            if (tacElem && tacElem.style.display === 'block') {
                tarteaucitron.userInterface.jsSizing('main');
            }

            if (tacCookieContainer && tacCookieContainer.style.display === 'block') {
                tarteaucitron.userInterface.jsSizing('cookie');
            }
        },
        "scrollEvent": function () {
            var scrollPos = window.pageYOffset || document.documentElement.scrollTop;
            var heightPosition;
            var tacPercentage = document.getElementById('tarteaucitronPercentage');
            var tacAlertBig = document.getElementById('tarteaucitronAlertBig');

            if (tacAlertBig && !tarteaucitron.highPrivacy) {
                if (tacAlertBig.style.display === 'block') {
                    heightPosition = tacAlertBig.offsetHeight + 'px';

                    if (scrollPos > (screen.height * 2)) {
                        tarteaucitron.userInterface.respondAll(true);
                    } else if (scrollPos > (screen.height / 2)) {
                        document.getElementById('tarteaucitronDisclaimerAlert').innerHTML = '<strong>' + tarteaucitron.lang.alertBigScroll + '</strong> ' + tarteaucitron.lang.alertBig;
                    }

                    if (tacPercentage) {
                        if (tarteaucitron.orientation === 'top') {
                            tacPercentage.style.top = heightPosition;
                        } else {
                            tacPercentage.style.bottom = heightPosition;
                        }
                        tacPercentage.style.width = ((100 / (screen.height * 2)) * scrollPos) + '%';
                    }
                }
            }
        },
    },
    "load": function () {
        "use strict";
        var cdn = tarteaucitron.cdn,
            language = tarteaucitron.getLanguage(),
            useJSDelivrMinifiedJS = (cdn.indexOf('cdn.jsdelivr.net') >= 0),
            pathToLang = cdn + 'lang/tarteaucitron.' + language + (useJSDelivrMinifiedJS ? '.min' : '') + '.js?v=' + tarteaucitron.version,
            pathToServices = cdn + 'tarteaucitron.services' + (useJSDelivrMinifiedJS ? '.min' : '') + '.js?v=' + tarteaucitron.version,
            linkElement = document.createElement('link'),
            defaults = {
                "adblocker": false,
                "hashtag": '#tarteaucitron',
                "cookieName": 'tarteaucitron',
                "highPrivacy": true,
                "orientation": "middle",
                "bodyPosition": "bottom",
                "removeCredit": false,
                "showAlertSmall": false,
                "showIcon": true,
                "iconPosition": "BottomRight",
                "cookieslist": false,
                "handleBrowserDNTRequest": false,
                "DenyAllCta": true,
                "AcceptAllCta" : true,
                "moreInfoLink": true,
                "privacyUrl": "",
                "useExternalCss": false,
                "useExternalJs": false,
                "mandatory": true,
                "mandatoryCta": true,
                "closePopup": false,
                "groupServices": false,
                "serviceDefaultState": 'wait',
            },
            params = tarteaucitron.parameters;

        // Don't show the middle bar if we are on the privacy policy or more page
        if (((tarteaucitron.parameters.readmoreLink !== undefined && window.location.href == tarteaucitron.parameters.readmoreLink) || window.location.href == tarteaucitron.parameters.privacyUrl) && tarteaucitron.parameters.orientation == "middle") {
            tarteaucitron.parameters.orientation = "bottom";
        }

        // Step -1
        if (typeof tarteaucitronCustomPremium !== 'undefined') {
            tarteaucitronCustomPremium();
        }

        // Step 0: get params
        if (params !== undefined) {

            for (var k in defaults) {
                if(!tarteaucitron.parameters.hasOwnProperty(k)) {
                    tarteaucitron.parameters[k] = defaults[k];
                }
            }
        }

        // global
        tarteaucitron.orientation = tarteaucitron.parameters.orientation;
        tarteaucitron.hashtag = tarteaucitron.parameters.hashtag;
        tarteaucitron.highPrivacy = tarteaucitron.parameters.highPrivacy;
        tarteaucitron.handleBrowserDNTRequest = tarteaucitron.parameters.handleBrowserDNTRequest;
        tarteaucitron.customCloserId = tarteaucitron.parameters.customCloserId;

        // Step 1: load css
        if ( !tarteaucitron.parameters.useExternalCss ) {
            linkElement.rel = 'stylesheet';
            linkElement.type = 'text/css';
            linkElement.href = cdn + 'css/tarteaucitron' + (useJSDelivrMinifiedJS ? '.min' : '') + '.css?v=' + tarteaucitron.version;
            document.getElementsByTagName('head')[0].appendChild(linkElement);
        }
        // Step 2: load language and services
        tarteaucitron.addInternalScript(pathToLang, '', function () {

          if(tarteaucitronCustomText !== ''){
            tarteaucitron.lang = tarteaucitron.AddOrUpdate(tarteaucitron.lang, tarteaucitronCustomText);
          }
            tarteaucitron.addInternalScript(pathToServices, '', function () {

                // css for the middle bar TODO: add it on the css file
                if (tarteaucitron.orientation === 'middle') {
                    var customThemeMiddle = document.createElement('style'),
                        cssRuleMiddle = 'div#tarteaucitronRoot.tarteaucitronBeforeVisible:before {content: \'\';position: fixed;width: 100%;height: 100%;background: white;top: 0;left: 0;z-index: 999;opacity: 0.5;}div#tarteaucitronAlertBig:before {content: \'' + tarteaucitron.lang.middleBarHead + '\';font-size: 35px;}body #tarteaucitronRoot div#tarteaucitronAlertBig {width: 60%;min-width: 285px;height: auto;margin: auto;left: 50%;top: 50%;transform: translate(-50%, -50%);box-shadow: 0 0 9000px #000;border-radius: 20px;padding: 35px 25px;}span#tarteaucitronDisclaimerAlert {padding: 0 30px;}#tarteaucitronRoot span#tarteaucitronDisclaimerAlert {margin: 10px 0 30px;display: block;text-align: center;font-size: 21px;}@media screen and (max-width: 900px) {div#tarteaucitronAlertBig button {margin: 0 auto 10px!important;display: block!important;}}';

                    customThemeMiddle.type = 'text/css';
                    if (customThemeMiddle.styleSheet) {
                        customThemeMiddle.styleSheet.cssText = cssRuleMiddle;
                    } else {
                        customThemeMiddle.appendChild(document.createTextNode(cssRuleMiddle));
                    }
                    document.getElementsByTagName('head')[0].appendChild(customThemeMiddle);
                }

                // css for the popup bar TODO: add it on the css file
                if (tarteaucitron.orientation === 'popup') {
                    var customThemePopup = document.createElement('style'),
                        cssRulePopup = 'div#tarteaucitronAlertBig:before {content: \'' + tarteaucitron.lang.middleBarHead + '\';font-size: 22px;}body #tarteaucitronRoot div#tarteaucitronAlertBig {bottom: 0;top: auto!important;left: 8px!important;right: auto!important;transform: initial!important;border-radius: 5px 5px 0 0!important;max-width: 250px!important;width: Calc(100% - 16px)!important;min-width: 0!important;padding: 25px 0;}span#tarteaucitronDisclaimerAlert {padding: 0 30px;font-size: 15px!important;}#tarteaucitronRoot span#tarteaucitronDisclaimerAlert {margin: 10px 0 30px;display: block;text-align: center;font-size: 21px;}div#tarteaucitronAlertBig button {margin: 0 auto 10px!important;display: block!important;width: Calc(100% - 60px);box-sizing: border-box;}';

                    customThemePopup.type = 'text/css';
                    if (customThemePopup.styleSheet) {
                        customThemePopup.styleSheet.cssText = cssRulePopup;
                    } else {
                        customThemePopup.appendChild(document.createTextNode(cssRulePopup));
                    }
                    document.getElementsByTagName('head')[0].appendChild(customThemePopup);
                }

                var body = document.body,
                    div = document.createElement('div'),
                    html = '',
                    index,
                    orientation = 'Top',
                    cat = ['ads', 'analytic', 'api', 'comment', 'social', 'support', 'video', 'other'],
                    i;

                cat = cat.sort(function (a, b) {
                    if (tarteaucitron.lang[a].title > tarteaucitron.lang[b].title) { return 1; }
                    if (tarteaucitron.lang[a].title < tarteaucitron.lang[b].title) { return -1; }
                    return 0;
                });

                // Step 3: prepare the html
                html += '<div role="heading" aria-level="1" id="tac_title" class="tac_visually-hidden">' + tarteaucitron.lang.title + '</div>';
                html += '<div id="tarteaucitronPremium"></div>';
                if (tarteaucitron.reloadThePage) {
                    html += '<button type="button" id="tarteaucitronBack" aria-label="' + tarteaucitron.lang.close + ' (' + tarteaucitron.lang.reload + ')" title="' + tarteaucitron.lang.close + ' (' + tarteaucitron.lang.reload + ')"></button>';
                } else {
                    html += '<button type="button" id="tarteaucitronBack" aria-label="' + tarteaucitron.lang.close + '" title="' + tarteaucitron.lang.close + '"></button>';
                }
                html += '<div id="tarteaucitron" role="dialog" aria-modal="true" aria-labelledby="dialogTitle" tabindex="-1">';
                if (tarteaucitron.reloadThePage) {
                    html += '   <button type="button" id="tarteaucitronClosePanel" aria-label="' + tarteaucitron.lang.close + ' (' + tarteaucitron.lang.reload + ')" title="' + tarteaucitron.lang.close + ' (' + tarteaucitron.lang.reload + ')">';
                } else {
                    html += '   <button type="button" id="tarteaucitronClosePanel">';
                }
                html += '       ' + tarteaucitron.lang.close;
                html += '   </button>';
                html += '   <div id="tarteaucitronServices">';
                html += '      <div class="tarteaucitronLine tarteaucitronMainLine" id="tarteaucitronMainLineOffset">';
                html += '         <span class="tarteaucitronH1" role="heading" aria-level="1" id="dialogTitle">'+ tarteaucitron.lang.title + '</span>';
                html += '         <div id="tarteaucitronInfo">';
                html += '         ' + tarteaucitron.lang.disclaimer;
                if (tarteaucitron.parameters.privacyUrl !== "") {
                    html += '   <br/><br/>';
                    html += '   <button type="button" id="tarteaucitronPrivacyUrlDialog" role="link">';
                    html += '       ' + tarteaucitron.lang.privacyUrl;
                    html += '   </button>';
                }
                html += '         </div>';
                html += '         <div class="tarteaucitronName">';
                html += '            <span class="tarteaucitronH2" role="heading" aria-level="2">' + tarteaucitron.lang.all + '</span>';
                html += '         </div>';
                html += '         <div class="tarteaucitronAsk" id="tarteaucitronScrollbarAdjust">';
                html += '            <button type="button" id="tarteaucitronAllAllowed" class="tarteaucitronAllow">';
                html += '               <span class="tarteaucitronCheck" aria-hidden="true"></span> ' + tarteaucitron.lang.allowAll;
                html += '            </button> ';
                html += '            <button type="button" id="tarteaucitronAllDenied" class="tarteaucitronDeny">';
                html += '               <span class="tarteaucitronCross" aria-hidden="true"></span> ' + tarteaucitron.lang.denyAll;
                html += '            </button>';
                html += '         </div>';
                html += '      </div>';
                html += '      <div class="tarteaucitronBorder">';
                html += '         <div class="clear"></div><ul>';


                if (tarteaucitron.parameters.mandatory == true) {
                   html += '<li id="tarteaucitronServicesTitle_mandatory">';
                   html += '<div class="tarteaucitronTitle">';
                   html += '   <button type="button" tabindex="-1"><span class="tarteaucitronPlus" aria-hidden="true"></span> ' + tarteaucitron.lang.mandatoryTitle + '</button>';
                   html += '</div>';
                   html += '<ul id="tarteaucitronServices_mandatory">';
                   html += '<li class="tarteaucitronLine">';
                   html += '   <div class="tarteaucitronName">';
                   html += '       <span class="tarteaucitronH3" role="heading" aria-level="3">' + tarteaucitron.lang.mandatoryText + '</span>';
                   html += '       <span class="tarteaucitronListCookies" aria-hidden="true"></span><br/>';
                   html += '   </div>';
                   if (tarteaucitron.parameters.mandatoryCta == true) {
                       html += '   <div class="tarteaucitronAsk">';
                       html += '       <button type="button" class="tarteaucitronAllow" tabindex="-1" disabled>';
                       html += '           <span class="tarteaucitronCheck" aria-hidden="true"></span> ' + tarteaucitron.lang.allow;
                       html += '       </button> ';
                       html += '       <button type="button" class="tarteaucitronDeny" style="visibility:hidden" tabindex="-1">';
                       html += '           <span class="tarteaucitronCross" aria-hidden="true"></span> ' + tarteaucitron.lang.deny;
                       html += '       </button> ';
                       html += '   </div>';
                   }
                   html += '</li>';
                   html += '</ul></li>';
                }

                for (i = 0; i < cat.length; i += 1) {
                    html += '         <li id="tarteaucitronServicesTitle_' + cat[i] + '" class="tarteaucitronHidden">';
                    html += '            <div class="tarteaucitronTitle" role="heading" aria-level="2">';
                    html += '               <button type="button" class="catToggleBtn" aria-expanded="false" data-cat="tarteaucitronDetails' + cat[i] + '"><span class="tarteaucitronPlus" aria-hidden="true"></span> ' + tarteaucitron.lang[cat[i]].title + '</button>';
                    html += '            </div>';
                    html += '            <div id="tarteaucitronDetails' + cat[i] + '" class="tarteaucitronDetails tarteaucitronInfoBox">';
                    html += '               ' + tarteaucitron.lang[cat[i]].details;
                    html += '            </div>';
                    html += '         <ul id="tarteaucitronServices_' + cat[i] + '"></ul></li>';
                }
                html += '             <li id="tarteaucitronNoServicesTitle" class="tarteaucitronLine">' + tarteaucitron.lang.noServices + '</li>';
                html += '         </ul>';
                html += '         <div class="tarteaucitronHidden tarteaucitron-spacer-20" id="tarteaucitronScrollbarChild"></div>';
                if (tarteaucitron.parameters.removeCredit === false) {
                    html += '     <a class="tarteaucitronSelfLink" href="https://tarteaucitron.io/" rel="nofollow noreferrer noopener" target="_blank" title="tarteaucitron ' + tarteaucitron.lang.newWindow + '"><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHcAAAAeCAYAAAAWwoEYAAADl0lEQVRoge1Y0W3bQAx9CjKARlC+9GVUmqDJBHEmiDyB6wkcTxBngtgTxJ0gzgQW4C/9aYOmE6g4lTQo+k6y3Rb94QOERNQd+cjj8XiGwWAwGAwGg8FgMBgMBoPB8F8RNRXe+whEKe7c36ZCAeCRxC9Rig2PUd8kPgAsoxSfQ3YAzAA8D/HwYYCb05kBKKO0teFkmbC1jlKsAnq/Abjn+QBqAIsoRS30ttwG/HNz1wH/XIxWTicLdvtW7xTAGEAMtP685CNsBTe2d/BLydfXAG57SEnMAST0zgYZSUCPk02bCvkJduIzuJzDLfPolbY+tLKmar+/8+IRePy4qdpE03qHuH8fipFb4N2+XdA3AJ/0vaQxt7s9FvkIS2XvtqnwM0rxpOQfbnE5G2LhTCmUO2fHIngOmcv+KG3HafDchB6ntwjYqenR2PqC7sOZ3E7FXHB0vqxoFyUyLh7OEH7LOGouvhhN3eIBeKXv0n5MsufdHqXcwYR5U2EbpV35lSspVPJmQj4TcgRK7jTg5IzmPUhhwM5a2WHUFCx+NgiDucmgh7idikLovHFlL0pxQ9xzX+IIP9Y6FrJsqhjlQpZRAkFVDCjZfcCHt6bqJDmuh5ylCWx0RVnk3oumaknqTH5sqrY0fBWyULaHUIgAgxb46MxV3DbieAhxOxUxjSuljig9lMQ/Bcfoi9BTEv9aLORSndVxYOH525sUDC6u2gWxcNzBNRxPanyh3ktKinOgy3WoxPbtUM0t6RkbQnzBnFPgi9GCOEubY9UffIryz9iKRe8s/FUfEWosJJGxagp85bpUO3VywQ46lOtAWfNxKwa4JXQ+628+bpxYGXXMzp5rXH401VEyXwIdowXFaKWSMFHvMTVmGnc+P3oXV2QOiBCfgex8QtcQCbcQE/H+eoHzrkFo1KM7zVO4jVVj5s6lRiWF7zyXyfRMc97J3tzj87mYqZ7E2YjzUct9GUi4tjHLR8dVkBLjQcuHFleWvQfRNEhFR7uX7pkctOwvZXsft7sAtyldEUIN2UTeLxnEfxKYswzdi88BdbZ8hifUoSMftQvP+muRwN6+Q3DeqqRExP9QmTtcheiHh0Ot1x2i2km1bP9pbufw5zZdyWsOrh7vQae5OZWbsMv30pi7cd/CKj3coPEVaCP4Zhx4eQWhOZ1Y9MTXGyP8/iGjEyfa1T4fO/4Lea9vBoPBYDAYDAaDwWAwGAwGwz8GgF8siXCCbrSRhgAAAABJRU5ErkJggg==" alt="tarteaucitron.io" /></a>';
                }
                html += '       </div>';
                html += '   </div>';
                html += '</div>';

                if (tarteaucitron.parameters.orientation === 'bottom') {
                    orientation = 'Bottom';
                }

                if (tarteaucitron.parameters.highPrivacy && !tarteaucitron.parameters.AcceptAllCta) {
                    html += '<div tabindex="-1" id="tarteaucitronAlertBig" class="tarteaucitronAlertBig' + orientation + '">';
                    //html += '<div class="tarteaucitronAlertBigWrapper">';
                    html += '   <span id="tarteaucitronDisclaimerAlert">';
                    html += '       ' + tarteaucitron.lang.alertBigPrivacy;
                    html += '   </span>';
                    //html += '   <span class="tarteaucitronAlertBigBtnWrapper">';
                    html += '   <button type="button" id="tarteaucitronPersonalize" aria-label="' + tarteaucitron.lang.personalize + ' ' + tarteaucitron.lang.modalWindow + '" title="' + tarteaucitron.lang.personalize + ' ' + tarteaucitron.lang.modalWindow + '">';
                    html += '       ' + tarteaucitron.lang.personalize;
                    html += '   </button>';

                    if (tarteaucitron.parameters.privacyUrl !== "") {
                        html += '   <button role="link" type="button" id="tarteaucitronPrivacyUrl">';
                        html += '       ' + tarteaucitron.lang.privacyUrl;
                        html += '   </button>';
                    }

                    //html += '   </span>';
                    //html += '</div>';
                    html += '</div>';
                } else {
                    html += '<div tabindex="-1" id="tarteaucitronAlertBig" class="tarteaucitronAlertBig' + orientation + '">';
                    //html += '<div class="tarteaucitronAlertBigWrapper">';
                    html += '   <span id="tarteaucitronDisclaimerAlert">';

                    if (tarteaucitron.parameters.highPrivacy) {
                        html += '       ' + tarteaucitron.lang.alertBigPrivacy;
                    } else {
                        html += '       ' + tarteaucitron.lang.alertBigClick + ' ' + tarteaucitron.lang.alertBig;
                    }

                    html += '   </span>';
                    //html += '   <span class="tarteaucitronAlertBigBtnWrapper">';
                    html += '   <button type="button" class="tarteaucitronCTAButton tarteaucitronAllow" id="tarteaucitronPersonalize2">';
                    html += '       <span class="tarteaucitronCheck" aria-hidden="true"></span> ' + tarteaucitron.lang.acceptAll;
                    html += '   </button>';


                    if (tarteaucitron.parameters.DenyAllCta) {
                        if (tarteaucitron.reloadThePage) {
                                    html += '   <button type="button" class="tarteaucitronCTAButton tarteaucitronDeny" id="tarteaucitronAllDenied2" aria-label="' + tarteaucitron.lang.denyAll + ' (' + tarteaucitron.lang.reload + ')" title="' + tarteaucitron.lang.denyAll + ' (' + tarteaucitron.lang.reload + ')">';
                        } else {
                                    html += '   <button type="button" class="tarteaucitronCTAButton tarteaucitronDeny" id="tarteaucitronAllDenied2">';
                        }
                                    html += '       <span class="tarteaucitronCross" aria-hidden="true"></span> ' + tarteaucitron.lang.denyAll;
                                    html += '   </button>';
                                    //html += '   <br/><br/>';
                    }

                    html += '   <button type="button" id="tarteaucitronCloseAlert" aria-label="' + tarteaucitron.lang.personalize + ' ' + tarteaucitron.lang.modalWindow + '" title="' + tarteaucitron.lang.personalize + ' ' + tarteaucitron.lang.modalWindow + '">';
                    html += '       ' + tarteaucitron.lang.personalize;
                    html += '   </button>';

                    if (tarteaucitron.parameters.privacyUrl !== "") {
                        html += '   <button type="button" id="tarteaucitronPrivacyUrl" role="link">';
                        html += '       ' + tarteaucitron.lang.privacyUrl;
                        html += '   </button>';
                    }

                    //html += '   </span>';
                    //html += '</div>';
                    html += '</div>';
                    html += '<div id="tarteaucitronPercentage"></div>';
                }

                if (tarteaucitron.parameters.showIcon === true) {
                    html += '<div id="tarteaucitronIcon" class="tarteaucitronIcon' + tarteaucitron.parameters.iconPosition + '" style="display: block">';
                    html += '   <button type="button" id="tarteaucitronManager" aria-label="' + tarteaucitron.lang.icon + ' ' + tarteaucitron.lang.modalWindow + '" title="' + tarteaucitron.lang.icon + ' ' + tarteaucitron.lang.modalWindow + '">';
                    html += '       <img src="' + (tarteaucitron.parameters.iconSrc ? tarteaucitron.parameters.iconSrc : 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAGA0lEQVRoge1a207bWBRdBtJwLYZhKDMVmlSK1LxNkPo+ZH6g8B6p5AuALwC+APoFoVLeoT8whPeRSt+CZKmZVu3AiIsRlEtCktGyjy8xzuXYhvahS0JJHJ/4rLP3XnuffcAPfGdQ7mM6jRLSAF4BxqsbewB2lRS2o35mpEQaJcwCyANIdLi1DGBNSWEzqmdHRqRRwjqAJclhtExOSUEP+/xIiDRKhhUWfL7ShTtBuJnqcw+/z4Ql0xNmMEwSSz4kuNIzSgpjSsqYJP/GeE185wYJroedRyiLNEpGLLzzrHSuk+83SgbxvOcyyRaDziWsRVZkSRDinpzPbwVGWIucuohsKynMS47fAQyls/BMSRmKJo3AFhG5wm2N1wF+Zs3zebbFfR0RxrXcJHQlgH+LMW616pR/WiIMEXfW3mtzXyeEGWsjKot8c4TOI98L+iKaR5PS6IUk88RLAO9F8UjrbYoYMOosNavpfmODIiwRXRR/G3ohaWVo1RU/c30jV8ab2mV8qVGzHWBOLyTLZiWs5Rolg/C3ySOi0tXP/k4aEwOwSBKPJs7Rp16ABJTe+p1xVX0It/owqqdDEMRoqd3RFxqDPh20Ig6VEPVC0i5RSCD+6wl6HlW7GksSlUMV11/GrUs5NasFLusDE9ELSVphXemtJwaT/8JyIRvxNNCfBmIiNdR04LII3DSrbe0yjqvyJF/ppptqVlt+MCLCEh/oOkPPP6N38Mb5cnQBGFsEqmXg5j3QMwoMzwGnr4HYbybBq13gZAOom/FO63zdf2qQArCsZrUN2TlJy69eSDKYV+6Q4MpP75ivHzPA53ngaBW4eGuSOt0A/lsGPmXMz0+3TFJcTfFbPfFbfnwlhON+iQhlWmA82CQ4ocQ7c6KcfL3DHuls0yT6Sx4YnLXJDCQOIRRv5yGIJBgP8Sdisj2qubpc5UGJmo+W49ifVmzL8HcpGhQPvZCUKiCliIhEN0tr2OCqHuSA8gwQ/92MkU7gxEmeVqGrTTgpxPXbUrtGWYus0I9thRIraagRQUIDf7Qn4yZhKRiFQIyhfMfUr3yblokVWSJ6k8xSnc7eNN/RjowfCYiFoDUFer1S3gW6JiJ8Nt30EMbEhU+vzSIztuRYjRLsR8IHLjlf7HZ+MrWWEXxNmbvapt4jGSqZRYSkGUetSNTPzHsui5YMQ2ajJUNks6mw4wT54Ok2ShnzzIPCUGshzawCRKy5FqvrTZe0RWzQGvw79m67XZjKmxJrLsICjtZa55gxXy+6F4sYsEtxTqhXdRTLC8ulSDaWoCLsolfN+8YUhOsJV709H7Cudr0LlVEtzqBcN+shEyThdR941OnAbF8pirKJqXyupTRTtQSReiVmXW1j7oBErB0d9xM2WEd5J9ZKYtuR4WKwwBSoORbpGrJ5ZI9lt71irJmGX1px0JYE26uNErawr2zfIcP4OHEKXm66PA3wjpCNEfpJunI4muifPjKvsFCkGjExTq63yxMJsZNMYF/J4HmDC5A3Yq36jy0ClePHVhwuu/b1HSFlEfHD5ZtD1bEK44Qu1mWys6tbWmZyPWckzlPTGiRw/XHCuk+q4Rek+mVrVL/UppwrdDEGNV2kpyuhccgc5Oxm9vWnn+19vJrVpLor0kTUrGacMplb1CfOFyTD4o9uNrHqr2Z+ZMSp1c2XcVSORnh9Q81q3k599ETgkNnjg0nGzi10K7rX+bZpHbrblPcY5A4Zxk2xcjzCvTpd9027Aa0QtouyyrKFRR6D/04DwkFGvHPXM3Qda/Jb4nPgI7hQLVM1q5HIBt2MzQNa57Z1DiiLAGa5Mi+O4Sz3Mpp6laPHO6InII3ITnX1QtI+EOX+m9ZxleOZ/j9PiuKoLi3aqXPuEoSye/Vhkm+LalbLtHhMS0R6zu7aZ3vP2jOjL7QVv4McxhcDnZIelAQibGIbULOapf3PuE1Vs9qeaOTdkVKr00gCQiw4NlBzDvf1Lxx+uP5r3Dgv5KQZRzWn+GRwz8jmDS8itUg7iB6vLuJCF5Uty4A9mVKkFR6MiJDachST/oHvHgD+B4SoUIitpF05AAAAAElFTkSuQmCC') + '" alt="' + tarteaucitron.lang.icon + ' ' + tarteaucitron.lang.modalWindow + '" title="' + tarteaucitron.lang.icon + ' ' + tarteaucitron.lang.modalWindow + '">';
                    html += '   </button>';
                    html += '</div>';
                }

                if (tarteaucitron.parameters.showAlertSmall === true) {
                    html += '<div id="tarteaucitronAlertSmall" class="tarteaucitronAlertSmall' + orientation + '">';
                    html += '   <button type="button" id="tarteaucitronManager" aria-label="' + tarteaucitron.lang.alertSmall + ' ' + tarteaucitron.lang.modalWindow + '" title="' + tarteaucitron.lang.alertSmall + ' ' + tarteaucitron.lang.modalWindow + '">';
                    html += '       ' + tarteaucitron.lang.alertSmall;
                    html += '       <span id="tarteaucitronDot">';
                    html += '           <span id="tarteaucitronDotGreen"></span>';
                    html += '           <span id="tarteaucitronDotYellow"></span>';
                    html += '           <span id="tarteaucitronDotRed"></span>';
                    html += '       </span>';
                    if (tarteaucitron.parameters.cookieslist === true) {
                        html += '   </button><!-- @whitespace';
                        html += '   --><button type="button" id="tarteaucitronCookiesNumber" aria-expanded="false" aria-controls="tarteaucitronCookiesListContainer">0</button>';
                        html += '   <div id="tarteaucitronCookiesListContainer">';
                        if (tarteaucitron.reloadThePage) {
                            html += '       <button type="button" id="tarteaucitronClosePanelCookie" aria-label="' + tarteaucitron.lang.close + ' (' + tarteaucitron.lang.reload + ')" title="' + tarteaucitron.lang.close + ' (' + tarteaucitron.lang.reload + ')">';
                        } else {
                            html += '       <button type="button" id="tarteaucitronClosePanelCookie">';
                        }
                        html += '           ' + tarteaucitron.lang.close;
                        html += '       </button>';
                        html += '       <div class="tarteaucitronCookiesListMain" id="tarteaucitronCookiesTitle">';
                        html += '            <span class="tarteaucitronH2" role="heading" aria-level="2" id="tarteaucitronCookiesNumberBis">0 cookie</span>';
                        html += '       </div>';
                        html += '       <div id="tarteaucitronCookiesList"></div>';
                        html += '    </div>';
                    } else {
                        html += '   </div>';
                    }
                    html += '</div>';
                }

                tarteaucitron.addInternalScript(tarteaucitron.cdn + 'advertising' + (useJSDelivrMinifiedJS ? '.min' : '') + '.js?v=' + tarteaucitron.version, '', function () {
                    if (tarteaucitronNoAdBlocker === true || tarteaucitron.parameters.adblocker === false) {

                        // create a wrapper container at the same level than tarteaucitron so we can add an aria-hidden when tarteaucitron is opened
                        /*var wrapper = document.createElement('div');
                        wrapper.id = "tarteaucitronContentWrapper";

                        while (document.body.firstChild)
                        {
                            wrapper.appendChild(document.body.firstChild);
                        }

                        // Append the wrapper to the body
                        document.body.appendChild(wrapper);*/

                        div.id = 'tarteaucitronRoot';
                        if (tarteaucitron.parameters.bodyPosition === 'top') {
                            // Prepend tarteaucitron: #tarteaucitronRoot first-child of the body for better accessibility
                            var bodyFirstChild = body.firstChild;
                            body.insertBefore(div, bodyFirstChild);
                        }
                        else {
                            // Append tarteaucitron: #tarteaucitronRoot last-child of the body
                            body.appendChild(div, body);
                        }

                        div.setAttribute('data-nosnippet', 'true');
                        div.setAttribute('lang', language);
                        div.setAttribute('role', 'region');
                        div.setAttribute('aria-labelledby', 'tac_title');

                        div.innerHTML = html;

                        //ie compatibility
                        var tacRootAvailableEvent;
                        if(typeof(Event) === 'function') {
                            tacRootAvailableEvent = new Event("tac.root_available");
                        }else if (typeof(document.createEvent) === 'function'){
                            tacRootAvailableEvent = document.createEvent('Event');
                            tacRootAvailableEvent.initEvent("tac.root_available", true, true);
                        }
                        //end ie compatibility

                        if (typeof(window.dispatchEvent) === 'function') {window.dispatchEvent(tacRootAvailableEvent);}

                        if (tarteaucitron.job !== undefined) {
                            tarteaucitron.job = tarteaucitron.cleanArray(tarteaucitron.job);
                            for (index = 0; index < tarteaucitron.job.length; index += 1) {
                                tarteaucitron.addService(tarteaucitron.job[index]);
                            }
                        } else {
                            tarteaucitron.job = [];
                        }

                        if (tarteaucitron.job.length === 0) {
                            tarteaucitron.userInterface.closeAlert();
                        }

                        tarteaucitron.isAjax = true;

                        tarteaucitron.job.push = function (id) {

                            // ie <9 hack
                            if (typeof tarteaucitron.job.indexOf === 'undefined') {
                                tarteaucitron.job.indexOf = function (obj, start) {
                                    var i,
                                        j = this.length;
                                    for (i = (start || 0); i < j; i += 1) {
                                        if (this[i] === obj) { return i; }
                                    }
                                    return -1;
                                };
                            }

                            if (tarteaucitron.job.indexOf(id) === -1) {
                                Array.prototype.push.call(this, id);
                            }
                            tarteaucitron.launch[id] = false;
                            tarteaucitron.addService(id);
                        };

                        if (document.location.hash === tarteaucitron.hashtag && tarteaucitron.hashtag !== '') {
                            tarteaucitron.userInterface.openPanel();
                        }

                        tarteaucitron.cookie.number();
                        setInterval(tarteaucitron.cookie.number, 60000);
                    }
                }, tarteaucitron.parameters.adblocker);

                if (tarteaucitron.parameters.adblocker === true) {
                    setTimeout(function () {
                        if (tarteaucitronNoAdBlocker === false) {
                            html = '<div id="tarteaucitronAlertBig" class="tarteaucitronAlertBig' + orientation + ' tarteaucitron-display-block" role="alert" aria-live="polite">';
                            html += '   <p id="tarteaucitronDisclaimerAlert">';
                            html += '       ' + tarteaucitron.lang.adblock + '<br/>';
                            html += '       <strong>' + tarteaucitron.lang.adblock_call + '</strong>';
                            html += '   </p>';
                            html += '   <button type="button" class="tarteaucitronCTAButton" id="tarteaucitronCTAButton">';
                            html += '       ' + tarteaucitron.lang.reload;
                            html += '   </button>';
                            html += '</div>';
                            html += '<div role="heading" aria-level="1" id="tac_title" class="tac_visually-hidden">' + tarteaucitron.lang.title + '</div>';
                            html += '<div id="tarteaucitronPremium"></div>';

                            div.id = 'tarteaucitronRoot';
                            if (tarteaucitron.parameters.bodyPosition === 'top') {
                                // Prepend tarteaucitron: #tarteaucitronRoot first-child of the body for better accessibility
                                var bodyFirstChild = body.firstChild;
                                body.insertBefore(div, bodyFirstChild);
                            }
                            else {
                                // Append tarteaucitron: #tarteaucitronRoot last-child of the body
                                body.appendChild(div, body);
                            }

                            div.setAttribute('data-nosnippet', 'true');
                            div.setAttribute('lang', language);
                            div.setAttribute('role', 'region');
                            div.setAttribute('aria-labelledby', 'tac_title');

                            div.innerHTML = html;
                        }
                    }, 1500);
                }
                if(tarteaucitron.parameters.closePopup === true){
                    setTimeout(function() {
                        var closeElement = document.getElementById('tarteaucitronAlertBig'),
                            closeSpan = document.createElement('span');
                        if (closeElement) {
                            closeSpan.textContent = 'X';
                            closeSpan.setAttribute('id', "tarteaucitronCloseCross");
                            closeElement.insertBefore(closeSpan, closeElement.firstElementChild);
                        }
                    }, 100);
                }


                if(tarteaucitron.parameters.groupServices === true) {
                    var tac_group_style = document.createElement('style');
                    tac_group_style.innerHTML = '.tarteaucitronTitle{display:none}';
                    document.head.appendChild(tac_group_style);
                    var cats = document.querySelectorAll('[id^="tarteaucitronServicesTitle_"]')
                    Array.prototype.forEach.call(cats, function(item) {
                        var cat = item.getAttribute('id').replace(/^(tarteaucitronServicesTitle_)/, "");
                        if (cat !== "mandatory") {
                            var html = '';
                            html += '<li  class="tarteaucitronLine">';
                            html += '   <div class="tarteaucitronName">';
                            html += '       <span class="tarteaucitronH3" role="heading" aria-level="2">'+tarteaucitron.lang[cat].title+'</span>';
                            html += '       <span>'+tarteaucitron.lang[cat].details+'</span>';
                            html += '   <button type="button" aria-expanded="false" class="tarteaucitron-toggle-group" id="tarteaucitron-toggle-group-'+cat+'">'+tarteaucitron.lang.alertSmall+' ('+document.getElementById("tarteaucitronServices_"+cat).childElementCount+')</button>';
                            html += '   </div>';
                            html += '   <div class="tarteaucitronAsk" id="tarteaucitron-group-'+cat+'">';
                            html += '       <button type="button" aria-label="' + tarteaucitron.lang.allow + ' ' + tarteaucitron.lang[cat].title + '" class="tarteaucitronAllow" id="tarteaucitron-accept-group-'+cat+'">';
                            html += '           <span class="tarteaucitronCheck" aria-hidden="true"></span> ' + tarteaucitron.lang.allow;
                            html += '       </button> ';
                            html += '       <button type="button" aria-label="' + tarteaucitron.lang.deny + ' ' + tarteaucitron.lang[cat].title + '" class="tarteaucitronDeny" id="tarteaucitron-reject-group-'+cat+'">';
                            html += '           <span class="tarteaucitronCross" aria-hidden="true"></span> ' + tarteaucitron.lang.deny;
                            html += '       </button>';
                            html += '   </div>';
                            html += '</li>';
                            var ul = document.createElement('ul');
                            ul.innerHTML = html;
                            item.insertBefore(ul, item.querySelector('#tarteaucitronServices_'+cat+''));
                            document.querySelector('#tarteaucitronServices_' + cat).style.display = 'none';
                            tarteaucitron.addClickEventToId("tarteaucitron-toggle-group-" + cat, function () {
                                tarteaucitron.userInterface.toggle('tarteaucitronServices_' + cat);
                               if (document.getElementById('tarteaucitronServices_' + cat).style.display == 'block') {
                                    tarteaucitron.userInterface.addClass('tarteaucitronServicesTitle_' + cat, 'tarteaucitronIsExpanded');
                                    document.getElementById('tarteaucitron-toggle-group-'+cat).setAttribute('aria-expanded', 'true');
                                } else {
                                    tarteaucitron.userInterface.removeClass('tarteaucitronServicesTitle_' + cat, 'tarteaucitronIsExpanded');
                                    document.getElementById('tarteaucitron-toggle-group-'+cat).setAttribute('aria-expanded', 'false');
                                }
                            });
                            tarteaucitron.addClickEventToId("tarteaucitron-accept-group-" + cat, function () {
                                tarteaucitron.userInterface.respondAll(true, cat);
                            });
                            tarteaucitron.addClickEventToId("tarteaucitron-reject-group-" + cat, function () {
                                tarteaucitron.userInterface.respondAll(false, cat);
                            });
                        }
                    });
                }
                tarteaucitron.userInterface.color("", true);

                // add a little timeout to be sure everything is accessible
                setTimeout(function () {

                    // Setup events
                    tarteaucitron.addClickEventToId("tarteaucitronCloseCross", function () {
                        tarteaucitron.userInterface.closeAlert();
                    });
                    tarteaucitron.addClickEventToId("tarteaucitronPersonalize", function () {
                        tarteaucitron.userInterface.openPanel();
                    });
                    tarteaucitron.addClickEventToId("tarteaucitronPersonalize2", function () {
                        tarteaucitron.userInterface.respondAll(true);
                    });
                    tarteaucitron.addClickEventToId("tarteaucitronManager", function () {
                        tarteaucitron.userInterface.openPanel();
                    });
                    tarteaucitron.addClickEventToId("tarteaucitronBack", function () {
                        tarteaucitron.userInterface.closePanel();
                    });
                    tarteaucitron.addClickEventToId("tarteaucitronClosePanel", function () {
                        tarteaucitron.userInterface.closePanel();
                    });
                    tarteaucitron.addClickEventToId("tarteaucitronClosePanelCookie", function () {
                        tarteaucitron.userInterface.closePanel();
                    });
                    tarteaucitron.addClickEventToId("tarteaucitronPrivacyUrl", function () {
                        document.location = tarteaucitron.parameters.privacyUrl;
                    });
                    tarteaucitron.addClickEventToId("tarteaucitronPrivacyUrlDialog", function () {
                        document.location = tarteaucitron.parameters.privacyUrl;
                    });
                    tarteaucitron.addClickEventToId("tarteaucitronCookiesNumber", function () {
                        tarteaucitron.userInterface.toggleCookiesList();
                    });
                    tarteaucitron.addClickEventToId("tarteaucitronAllAllowed", function () {
                        tarteaucitron.userInterface.respondAll(true);
                    });
                    tarteaucitron.addClickEventToId("tarteaucitronAllDenied", function () {
                        tarteaucitron.userInterface.respondAll(false);
                    });
                    tarteaucitron.addClickEventToId("tarteaucitronAllDenied2", function () {
                        tarteaucitron.userInterface.respondAll(false, '', true);
                        if (tarteaucitron.reloadThePage === true) {
                            window.location.reload();
                        }
                    });
                    tarteaucitron.addClickEventToId("tarteaucitronCloseAlert", function () {
                        tarteaucitron.userInterface.openPanel();
                    });
                    tarteaucitron.addClickEventToId("tarteaucitronCTAButton", function () {
                        location.reload();
                    });
                    var toggleBtns = document.getElementsByClassName("catToggleBtn"), i;
                    for (i = 0; i < toggleBtns.length; i++) {
                        toggleBtns[i].dataset.index = i;
                        tarteaucitron.addClickEventToElement(toggleBtns[i], function () {
                            tarteaucitron.userInterface.toggle('tarteaucitronDetails' + cat[this.dataset.index], 'tarteaucitronInfoBox');
                            if (document.getElementById('tarteaucitronDetails' + cat[this.dataset.index]).style.display === 'block') {
                                this.setAttribute('aria-expanded', 'true');
                            } else {
                                this.setAttribute('aria-expanded', 'false');
                            }
                            return false;
                        });
                    }

                    var allowBtns = document.getElementsByClassName("tarteaucitronAllow");
                    for (i = 0; i < allowBtns.length; i++) {
                        tarteaucitron.addClickEventToElement(allowBtns[i], function () {
                            tarteaucitron.userInterface.respond(this, true);
                        });
                    }
                    var denyBtns = document.getElementsByClassName("tarteaucitronDeny");
                    for (i = 0; i < denyBtns.length; i++) {
                        tarteaucitron.addClickEventToElement(denyBtns[i], function () {
                            tarteaucitron.userInterface.respond(this, false);
                        });
                    }
                    if(tarteaucitron.events.load) {
                        tarteaucitron.events.load();
                    }
                }, 500);

            });
        });
    },
    "addService": function (serviceId) {
        "use strict";
        var html = '',
            s = tarteaucitron.services,
            service = s[serviceId],
            cookie = tarteaucitron.cookie.read(),
            hostname = document.location.hostname,
            hostRef = document.referrer.split('/')[2],
            isNavigating = (hostRef === hostname && window.location.href !== tarteaucitron.parameters.privacyUrl),
            isAutostart = (!service.needConsent),
            isWaiting = (cookie.indexOf(service.key + '=wait') >= 0),
            isDenied = (cookie.indexOf(service.key + '=false') >= 0),
            isAllowed = ((cookie.indexOf(service.key + '=true') >= 0) || (!service.needConsent && cookie.indexOf(service.key + '=false') < 0)),
            isResponded = (cookie.indexOf(service.key + '=false') >= 0 || cookie.indexOf(service.key + '=true') >= 0),
            isDNTRequested = (navigator.doNotTrack === "1" || navigator.doNotTrack === "yes" || navigator.msDoNotTrack === "1" || window.doNotTrack === "1"),
            currentStatus = (isAllowed) ? tarteaucitron.lang.allowed : tarteaucitron.lang.disallowed,
            state = (undefined !== service.defaultState) ? service.defaultState :
                    (undefined !== tarteaucitron.parameters.serviceDefaultState ? tarteaucitron.parameters.serviceDefaultState : 'wait');


        if (tarteaucitron.added[service.key] !== true) {
            tarteaucitron.added[service.key] = true;

            html += '<li id="' + service.key + 'Line" class="tarteaucitronLine">';
            html += '   <div class="tarteaucitronName">';
            html += '       <span class="tarteaucitronH3" role="heading" aria-level="3">' + service.name + '</span>';
            html += '       <span class="tacCurrentStatus" id="tacCurrentStatus' + service.key + '">'+currentStatus+'</span>';
            html += '       <span class="tarteaucitronReadmoreSeparator"> - </span>';
            html += '       <span id="tacCL' + service.key + '" class="tarteaucitronListCookies">';
            if (drupalSettings.tacjs.services[service.key] !== undefined) {
                html += drupalSettings.tacjs.services[service.key].readMore;
            }
            html += '</span><br/>';
            if (tarteaucitron.parameters.moreInfoLink == true) {

                var link = 'https://tarteaucitron.io/service/' + service.key + '/';
                if (service.readmoreLink !== undefined && service.readmoreLink !== '') {
                    link = service.readmoreLink;
                }
                if (tarteaucitron.parameters.readmoreLink !== undefined && tarteaucitron.parameters.readmoreLink !== '') {
                    link = tarteaucitron.parameters.readmoreLink;
                }
                html += '       <a href="' + link + '" target="_blank" rel="noreferrer noopener nofollow" title="' + tarteaucitron.lang.more + ' : ' + tarteaucitron.lang.cookieDetail + ' ' + service.name + ' ' + tarteaucitron.lang.ourSite + ' ' + tarteaucitron.lang.newWindow +'" class="tarteaucitronReadmoreInfo">';
                html += '           ' + tarteaucitron.lang.more;
                html += '       </a>';
                html += '       <span class="tarteaucitronReadmoreSeparator"> - </span>';
                html += '       <a href="' + service.uri + '" target="_blank" rel="noreferrer noopener" title="' + tarteaucitron.lang.source + ' ' + service.name + ' ' + tarteaucitron.lang.newWindow + '" class="tarteaucitronReadmoreOfficial">';
                html += '           ' + tarteaucitron.lang.source;
                html += '       </a>';
            }

            html += '   </div>';
            html += '   <div class="tarteaucitronAsk">';
            html += '       <button type="button" aria-label="' + tarteaucitron.lang.allow + ' ' + service.name + '" id="' + service.key + 'Allowed" class="tarteaucitronAllow">';
            html += '           <span class="tarteaucitronCheck" aria-hidden="true"></span> ' + tarteaucitron.lang.allow;
            html += '       </button> ';
            html += '       <button type="button" aria-label="' + tarteaucitron.lang.deny + ' ' + service.name + '" id="' + service.key + 'Denied" class="tarteaucitronDeny">';
            html += '           <span class="tarteaucitronCross" aria-hidden="true"></span> ' + tarteaucitron.lang.deny;
            html += '       </button>';
            html += '   </div>';
            html += '</li>';

            tarteaucitron.userInterface.css('tarteaucitronServicesTitle_' + service.type, 'display', 'block');

            if (document.getElementById('tarteaucitronServices_' + service.type) !== null) {
                document.getElementById('tarteaucitronServices_' + service.type).innerHTML += html;
            }

            tarteaucitron.userInterface.css('tarteaucitronNoServicesTitle', 'display', 'none');

            tarteaucitron.userInterface.order(service.type);

            tarteaucitron.addClickEventToId(service.key + 'Allowed', function () {
                tarteaucitron.userInterface.respond(this, true);
            });

            tarteaucitron.addClickEventToId(service.key + 'Denied', function () {
                tarteaucitron.userInterface.respond(this, false);
            });
        }

        tarteaucitron.pro('!' + service.key + '=' + isAllowed);

        // allow by default for non EU
        if (isResponded === false && tarteaucitron.user.bypass === true) {
            isAllowed = true;
            tarteaucitron.cookie.create(service.key, true);
        }

        if ((!isResponded && (isAutostart || (isNavigating && isWaiting)) && !tarteaucitron.highPrivacy) || isAllowed) {
            if (!isAllowed || (!service.needConsent && cookie.indexOf(service.key + '=false') < 0)) {
                tarteaucitron.cookie.create(service.key, true);
            }
            if (tarteaucitron.launch[service.key] !== true) {
                tarteaucitron.launch[service.key] = true;
                if (typeof tarteaucitronMagic === 'undefined' || tarteaucitronMagic.indexOf("_" + service.key + "_") < 0) { service.js(); }
                tarteaucitron.sendEvent(service.key + '_loaded');
            }
            tarteaucitron.state[service.key] = true;
            tarteaucitron.userInterface.color(service.key, true);
        } else if (isDenied) {
            if (typeof service.fallback === 'function') {
                if (typeof tarteaucitronMagic === 'undefined' || tarteaucitronMagic.indexOf("_" + service.key + "_") < 0) { service.fallback(); }
            }
            tarteaucitron.state[service.key] = false;
            tarteaucitron.userInterface.color(service.key, false);
        } else if (!isResponded && isDNTRequested && tarteaucitron.handleBrowserDNTRequest) {
            tarteaucitron.cookie.create(service.key, 'false');
            if (typeof service.fallback === 'function') {
                if (typeof tarteaucitronMagic === 'undefined' || tarteaucitronMagic.indexOf("_" + service.key + "_") < 0) { service.fallback(); }
            }
            tarteaucitron.state[service.key] = false;
            tarteaucitron.userInterface.color(service.key, false);
        } else if (!isResponded) {
            tarteaucitron.cookie.create(service.key, state);
            if (typeof tarteaucitronMagic === 'undefined' || tarteaucitronMagic.indexOf("_" + service.key + "_") < 0) {
                if(true === state && typeof service.js === 'function') {
                    service.js();
                } else if (typeof service.fallback === 'function') {
                    service.fallback();
                }
            }

            tarteaucitron.userInterface.color(service.key, state);

            if( 'wait' === state ) {
                tarteaucitron.userInterface.openAlert();
            }
        }

        tarteaucitron.cookie.checkCount(service.key);
        tarteaucitron.sendEvent(service.key + '_added')
    },
    "sendEvent" : function(event_key) {
        if(event_key !== undefined) {
            //ie compatibility
            var send_event_item;
            if(typeof(Event) === 'function') {
                send_event_item = new Event(event_key);
            }else if (typeof(document.createEvent) === 'function'){
                send_event_item = document.createEvent('Event');
                send_event_item.initEvent(event_key, true, true);
            }
            //end ie compatibility

            document.dispatchEvent(send_event_item);
        }
    },
    "cleanArray": function cleanArray(arr) {
        "use strict";
        var i,
            len = arr.length,
            out = [],
            obj = {},
            s = tarteaucitron.services;

        for (i = 0; i < len; i += 1) {
            if (!obj[arr[i]]) {
                obj[arr[i]] = {};
                if (tarteaucitron.services[arr[i]] !== undefined) {
                    out.push(arr[i]);
                }
            }
        }

        out = out.sort(function (a, b) {
            if (s[a].type + s[a].key > s[b].type + s[b].key) { return 1; }
            if (s[a].type + s[a].key < s[b].type + s[b].key) { return -1; }
            return 0;
        });

        return out;
    },
    "userInterface": {
        "css": function (id, property, value) {
            "use strict";
            if (document.getElementById(id) !== null) {

                if (property == "display" && value == "none" && (id == "tarteaucitron" || id == "tarteaucitronBack" || id == "tarteaucitronAlertBig")) {
                    document.getElementById(id).style["opacity"] = "0";

                    setTimeout(function() {document.getElementById(id).style[property] = value;}, 200);
                } else {

                    document.getElementById(id).style[property] = value;

                    if (property == "display" && value == "block" && (id == "tarteaucitron" || id == "tarteaucitronAlertBig")) {
                        document.getElementById(id).style["opacity"] = "0";
                        setTimeout(function() {document.getElementById(id).style["opacity"] = "1";}, 1);
                    }

                    if (property == "display" && value == "block" && id == "tarteaucitronBack") {
                        document.getElementById(id).style["opacity"] = "0";
                        setTimeout(function() {document.getElementById(id).style["opacity"] = "0.7";}, 1);
                    }
                }
            }
        },
        "addClass": function (id, className) {
            "use strict";
            if (document.getElementById(id) !== null && document.getElementById(id).classList !== undefined) {
                document.getElementById(id).classList.add(className);
            }
        },
        "removeClass": function (id, className) {
            "use strict";
            if (document.getElementById(id) !== null && document.getElementById(id).classList !== undefined) {
                document.getElementById(id).classList.remove(className);
            }
        },
        "respondAll": function (status, type, allowSafeAnalytics) {
            "use strict";
            var s = tarteaucitron.services,
                service,
                key,
                index = 0;

            for (index = 0; index < tarteaucitron.job.length; index += 1) {

                if (typeof type !== 'undefined' && type !== '' && s[tarteaucitron.job[index]].type !== type) {
                    continue;
                }

                if (allowSafeAnalytics && typeof s[tarteaucitron.job[index]].safeanalytic !== "undefined" && s[tarteaucitron.job[index]].safeanalytic === true) {
                    continue;
                }

                service = s[tarteaucitron.job[index]];
                key = service.key;
                if (tarteaucitron.state[key] !== status) {
                    if (status === false && tarteaucitron.launch[key] === true) {
                        tarteaucitron.reloadThePage = true;
                        if (tarteaucitron.checkIfExist('tarteaucitronClosePanel')) {
                            var ariaCloseValue = document.getElementById('tarteaucitronClosePanel').textContent.trim() + ' (' + tarteaucitron.lang.reload + ')';
                            document.getElementById('tarteaucitronClosePanel').setAttribute("aria-label", ariaCloseValue);
                            document.getElementById('tarteaucitronClosePanel').setAttribute("title", ariaCloseValue);
                        }
                    }
                    if (tarteaucitron.launch[key] !== true && status === true) {

                        tarteaucitron.pro('!' + key + '=engage');

                        tarteaucitron.launch[key] = true;
                        if (typeof tarteaucitronMagic === 'undefined' || tarteaucitronMagic.indexOf("_" + key + "_") < 0) { tarteaucitron.services[key].js(); }
                        tarteaucitron.sendEvent(key + '_loaded');
                    }
                    var itemStatusElem = document.getElementById('tacCurrentStatus'+key);
                    if(status == true){
                        itemStatusElem.innerHTML = tarteaucitron.lang.allowed;
                        tarteaucitron.sendEvent(key + '_allowed');
                    }else{
                        itemStatusElem.innerHTML = tarteaucitron.lang.disallowed;
                        tarteaucitron.sendEvent(key + '_disallowed');
                    }
                    tarteaucitron.state[key] = status;
                    tarteaucitron.cookie.create(key, status);
                    tarteaucitron.userInterface.color(key, status);
                }
            }
        },
        "respond": function (el, status) {
            "use strict";
            if (el.id === '') {
                return;
            }
            var key = el.id.replace(new RegExp("(Eng[0-9]+|Allow|Deni)ed", "g"), '');

            if (key.substring(0, 13) === 'tarteaucitron' || key === '') {return;}

            // return if same state
            if (tarteaucitron.state[key] === status) {
                return;
            }

            if (status === false && tarteaucitron.launch[key] === true) {
                tarteaucitron.reloadThePage = true;
                if (tarteaucitron.checkIfExist('tarteaucitronClosePanel')) {
                    var ariaCloseValue = document.getElementById('tarteaucitronClosePanel').textContent.trim() + ' (' + tarteaucitron.lang.reload + ')';
                    document.getElementById('tarteaucitronClosePanel').setAttribute("aria-label", ariaCloseValue);
                    document.getElementById('tarteaucitronClosePanel').setAttribute("title", ariaCloseValue);
                }
            }

            // if not already launched... launch the service
            if (status === true) {
                if (tarteaucitron.launch[key] !== true) {

                    tarteaucitron.pro('!' + key + '=engage');

                    tarteaucitron.launch[key] = true;
                    if (typeof tarteaucitronMagic === 'undefined' || tarteaucitronMagic.indexOf("_" + key + "_") < 0) { tarteaucitron.services[key].js(); }
                    tarteaucitron.sendEvent(key + '_loaded');
                }
            }
            var itemStatusElem = document.getElementById('tacCurrentStatus'+key);
            if(status == true){
                itemStatusElem.innerHTML = tarteaucitron.lang.allowed;
                tarteaucitron.sendEvent(key + '_allowed');
            }else{
                itemStatusElem.innerHTML = tarteaucitron.lang.disallowed;
                tarteaucitron.sendEvent(key + '_disallowed');
            }
            tarteaucitron.state[key] = status;
            tarteaucitron.cookie.create(key, status);
            tarteaucitron.userInterface.color(key, status);
        },
        "color": function (key, status) {
            "use strict";
            var c = 'tarteaucitron',
                nbDenied = 0,
                nbPending = 0,
                nbAllowed = 0,
                sum = tarteaucitron.job.length,
                index,
                s = tarteaucitron.services;

            if (key !== "") {

            if (status === true) {
                tarteaucitron.userInterface.addClass(key + 'Line', 'tarteaucitronIsAllowed');
                tarteaucitron.userInterface.removeClass(key + 'Line', 'tarteaucitronIsDenied');
                document.getElementById(key + 'Allowed').setAttribute('aria-pressed', 'true');
                document.getElementById(key + 'Denied').setAttribute('aria-pressed', 'false');
            } else if (status === false) {
                tarteaucitron.userInterface.removeClass(key + 'Line', 'tarteaucitronIsAllowed');
                tarteaucitron.userInterface.addClass(key + 'Line', 'tarteaucitronIsDenied');
                document.getElementById(key + 'Allowed').setAttribute('aria-pressed', 'false');
                document.getElementById(key + 'Denied').setAttribute('aria-pressed', 'true');
            } else {
                document.getElementById(key + 'Allowed').setAttribute('aria-pressed', 'false');
                document.getElementById(key + 'Denied').setAttribute('aria-pressed', 'false');
            }

            // check if all services are allowed
            var sumToRemove = 0;
            for (index = 0; index < sum; index += 1) {

                if (typeof s[tarteaucitron.job[index]].safeanalytic !== "undefined" && s[tarteaucitron.job[index]].safeanalytic === true) {
                    sumToRemove += 1;
                    continue;
                }

                if (tarteaucitron.state[tarteaucitron.job[index]] === false) {
                    nbDenied += 1;
                } else if (tarteaucitron.state[tarteaucitron.job[index]] === undefined) {
                    nbPending += 1;
                } else if (tarteaucitron.state[tarteaucitron.job[index]] === true) {
                    nbAllowed += 1;
                }
            }
            sum -= sumToRemove;

            tarteaucitron.userInterface.css(c + 'DotGreen', 'width', ((100 / sum) * nbAllowed) + '%');
            tarteaucitron.userInterface.css(c + 'DotYellow', 'width', ((100 / sum) * nbPending) + '%');
            tarteaucitron.userInterface.css(c + 'DotRed', 'width', ((100 / sum) * nbDenied) + '%');

            if (nbDenied === 0 && nbPending === 0) {
                tarteaucitron.userInterface.removeClass(c + 'AllDenied', c + 'IsSelected');
                tarteaucitron.userInterface.addClass(c + 'AllAllowed', c + 'IsSelected');

                tarteaucitron.userInterface.addClass(c + 'MainLineOffset', c + 'IsAllowed');
                tarteaucitron.userInterface.removeClass(c + 'MainLineOffset', c + 'IsDenied');

                document.getElementById(c + 'AllDenied').setAttribute('aria-pressed', 'false');
                document.getElementById(c + 'AllAllowed').setAttribute('aria-pressed', 'true');

            } else if (nbAllowed === 0 && nbPending === 0) {
                tarteaucitron.userInterface.removeClass(c + 'AllAllowed', c + 'IsSelected');
                tarteaucitron.userInterface.addClass(c + 'AllDenied', c + 'IsSelected');

                tarteaucitron.userInterface.removeClass(c + 'MainLineOffset', c + 'IsAllowed');
                tarteaucitron.userInterface.addClass(c + 'MainLineOffset', c + 'IsDenied');

                document.getElementById(c + 'AllDenied').setAttribute('aria-pressed', 'true');
                document.getElementById(c + 'AllAllowed').setAttribute('aria-pressed', 'false');

            } else {
                tarteaucitron.userInterface.removeClass(c + 'AllAllowed', c + 'IsSelected');
                tarteaucitron.userInterface.removeClass(c + 'AllDenied', c + 'IsSelected');

                tarteaucitron.userInterface.removeClass(c + 'MainLineOffset', c + 'IsAllowed');
                tarteaucitron.userInterface.removeClass(c + 'MainLineOffset', c + 'IsDenied');

                document.getElementById(c + 'AllDenied').setAttribute('aria-pressed', 'false');
                document.getElementById(c + 'AllAllowed').setAttribute('aria-pressed', 'false');
            }

            // close the alert if all service have been reviewed
            if (nbPending === 0) {
                tarteaucitron.userInterface.closeAlert();
            }

            if (tarteaucitron.services[key].cookies.length > 0 && status === false) {
                tarteaucitron.cookie.purge(tarteaucitron.services[key].cookies);
            }

            if (status === true) {
                if (document.getElementById('tacCL' + key) !== null) {
                    if (drupalSettings.tacjs.services[key] !== undefined && drupalSettings.tacjs.services[key].readMore !== '' ) {
                        document.getElementById('tacCL' + key).innerHTML = drupalSettings.tacjs.services[key].readMore;
                    } else {
                        document.getElementById('tacCL' + key).innerHTML = '...';
                    }
                }
                setTimeout(function () {
                    tarteaucitron.cookie.checkCount(key);
                }, 2500);
            } else {
                tarteaucitron.cookie.checkCount(key);
            }

            }

	    // groups
            var cats = document.querySelectorAll('[id^="tarteaucitronServicesTitle_"]')
            Array.prototype.forEach.call(cats, function(item) {
                var cat = item.getAttribute('id').replace(/^(tarteaucitronServicesTitle_)/, ""),
                    total = document.getElementById("tarteaucitronServices_"+cat).childElementCount;
                var doc = document.getElementById("tarteaucitronServices_"+cat),
                    groupdenied = 0,
                    groupallowed = 0;
                for (var ii = 0; ii < doc.children.length; ii++) {
                    if (doc.children[ii].className == "tarteaucitronLine tarteaucitronIsDenied") {
                        groupdenied++;
                    }
                    if (doc.children[ii].className == "tarteaucitronLine tarteaucitronIsAllowed") {
                        groupallowed++;
                    }
                }
                if (total === groupallowed) {
                    tarteaucitron.userInterface.removeClass('tarteaucitron-group-'+cat, 'tarteaucitronIsDenied');
                    tarteaucitron.userInterface.addClass('tarteaucitron-group-'+cat, 'tarteaucitronIsAllowed');

                    if (document.getElementById('tarteaucitron-reject-group-'+cat)) {
                        document.getElementById('tarteaucitron-reject-group-'+cat).setAttribute('aria-pressed', 'false');
                        document.getElementById('tarteaucitron-accept-group-'+cat).setAttribute('aria-pressed', 'true');
                    }
                }
                if (total === groupdenied) {
                    tarteaucitron.userInterface.addClass('tarteaucitron-group-'+cat, 'tarteaucitronIsDenied');
                    tarteaucitron.userInterface.removeClass('tarteaucitron-group-'+cat, 'tarteaucitronIsAllowed');

                    if (document.getElementById('tarteaucitron-reject-group-'+cat)) {
                        document.getElementById('tarteaucitron-reject-group-'+cat).setAttribute('aria-pressed', 'true');
                        document.getElementById('tarteaucitron-accept-group-'+cat).setAttribute('aria-pressed', 'false');
                    }
                }
                if (total !== groupdenied && total !== groupallowed) {
                    tarteaucitron.userInterface.removeClass('tarteaucitron-group-'+cat, 'tarteaucitronIsDenied');
                    tarteaucitron.userInterface.removeClass('tarteaucitron-group-'+cat, 'tarteaucitronIsAllowed');

                    if (document.getElementById('tarteaucitron-reject-group-'+cat)) {
                        document.getElementById('tarteaucitron-reject-group-'+cat).setAttribute('aria-pressed', 'false');
                        document.getElementById('tarteaucitron-accept-group-'+cat).setAttribute('aria-pressed', 'false');
                    }
                }
                groupdenied = 0;
                groupallowed = 0;
            });

        },
        "openPanel": function () {
            "use strict";

            tarteaucitron.userInterface.css('tarteaucitron', 'display', 'block');
            tarteaucitron.userInterface.css('tarteaucitronBack', 'display', 'block');
            tarteaucitron.userInterface.css('tarteaucitronCookiesListContainer', 'display', 'none');

            document.getElementById('tarteaucitronClosePanel').focus();
            if (document.getElementsByTagName('body')[0].classList !== undefined) {
                document.getElementsByTagName('body')[0].classList.add('tarteaucitron-modal-open');
            }
            tarteaucitron.userInterface.focusTrap();
            tarteaucitron.userInterface.jsSizing('main');

            //ie compatibility
            var tacOpenPanelEvent;
            if(typeof(Event) === 'function') {
                tacOpenPanelEvent = new Event("tac.open_panel");
            }else if (typeof(document.createEvent) === 'function'){
                tacOpenPanelEvent = document.createEvent('Event');
                tacOpenPanelEvent.initEvent("tac.open_panel", true, true);
            }
            //end ie compatibility

            if (typeof(window.dispatchEvent) === 'function') {window.dispatchEvent(tacOpenPanelEvent);}
        },
        "closePanel": function () {
            "use strict";

            if (document.location.hash === tarteaucitron.hashtag) {
                if (window.history) {
                    window.history.replaceState('', document.title, window.location.pathname + window.location.search);
                } else {
                    document.location.hash = '';
                }
            }
            if (tarteaucitron.checkIfExist('tarteaucitron')) {
                // accessibility: manage focus on close panel
                if (tarteaucitron.checkIfExist('tarteaucitronCloseAlert')) {
                    document.getElementById('tarteaucitronCloseAlert').focus();
                } else if (tarteaucitron.checkIfExist('tarteaucitronManager')) {
                    document.getElementById('tarteaucitronManager').focus();
                } else if (tarteaucitron.customCloserId && tarteaucitron.checkIfExist(tarteaucitron.customCloserId)) {
                    document.getElementById(tarteaucitron.customCloserId).focus();
                }
                tarteaucitron.userInterface.css('tarteaucitron', 'display', 'none');
            }

            if (tarteaucitron.checkIfExist('tarteaucitronCookiesListContainer') && tarteaucitron.checkIfExist('tarteaucitronCookiesNumber')) {
                // accessibility: manage focus on close cookies list
                document.getElementById('tarteaucitronCookiesNumber').focus();
                document.getElementById('tarteaucitronCookiesNumber').setAttribute("aria-expanded", "false");
                tarteaucitron.userInterface.css('tarteaucitronCookiesListContainer', 'display', 'none');
            }

            tarteaucitron.fallback(['tarteaucitronInfoBox'], function (elem) {
                elem.style.display = 'none';
            }, true);

            if (tarteaucitron.reloadThePage === true) {
                window.location.reload();
            } else {
                tarteaucitron.userInterface.css('tarteaucitronBack', 'display', 'none');
            }
            if (document.getElementsByTagName('body')[0].classList !== undefined) {
                document.getElementsByTagName('body')[0].classList.remove('tarteaucitron-modal-open');
            }

            //ie compatibility
            var tacClosePanelEvent;
            if(typeof(Event) === 'function') {
                tacClosePanelEvent = new Event("tac.close_panel");
            }else if (typeof(document.createEvent) === 'function'){
                tacClosePanelEvent = document.createEvent('Event');
                tacClosePanelEvent.initEvent("tac.close_panel", true, true);
            }
            //end ie compatibility

            if (typeof(window.dispatchEvent) === 'function') {window.dispatchEvent(tacClosePanelEvent);}
        },
        "focusTrap": function() {
            "use strict";

            var focusableEls,
                firstFocusableEl,
                lastFocusableEl,
                filtered;

            focusableEls = document.getElementById('tarteaucitron').querySelectorAll('a[href], button');
            filtered = [];

            // get only visible items
            for (var i = 0, max = focusableEls.length; i < max; i++) {
                if (focusableEls[i].offsetHeight > 0) {
                   filtered.push(focusableEls[i]);
                }
            }

            firstFocusableEl = filtered[0];
            lastFocusableEl = filtered[filtered.length - 1];

            //loop focus inside tarteaucitron
            document.getElementById('tarteaucitron').addEventListener("keydown", function (evt) {

                if ( evt.key === 'Tab' || evt.keyCode === 9 ) {

                    if ( evt.shiftKey ) /* shift + tab */ {
                        if (document.activeElement === firstFocusableEl) {
                            lastFocusableEl.focus();
                            evt.preventDefault();
                        }
                    } else /* tab */ {
                        if (document.activeElement === lastFocusableEl) {
                            firstFocusableEl.focus();
                            evt.preventDefault();
                        }
                    }
                }
            })
        },
        "openAlert": function () {
            "use strict";
            var c = 'tarteaucitron';
            tarteaucitron.userInterface.css(c + 'Percentage', 'display', 'block');
            tarteaucitron.userInterface.css(c + 'AlertSmall', 'display', 'none');
            tarteaucitron.userInterface.css(c + 'Icon', 'display', 'none');
            tarteaucitron.userInterface.css(c + 'AlertBig',   'display', 'block');
            tarteaucitron.userInterface.addClass(c + 'Root',   'tarteaucitronBeforeVisible');

            //ie compatibility
            var tacOpenAlertEvent;
            if(typeof(Event) === 'function') {
                tacOpenAlertEvent = new Event("tac.open_alert");
            }else if (typeof(document.createEvent) === 'function'){
                tacOpenAlertEvent = document.createEvent('Event');
                tacOpenAlertEvent.initEvent("tac.open_alert", true, true);
            }
            //end ie compatibility

            if (document.getElementById('tarteaucitronAlertBig') !== null) {
                document.getElementById('tarteaucitronAlertBig').focus();
            }

            if (typeof(window.dispatchEvent) === 'function') {window.dispatchEvent(tacOpenAlertEvent);}
        },
        "closeAlert": function () {
            "use strict";
            var c = 'tarteaucitron';
            tarteaucitron.userInterface.css(c + 'Percentage', 'display', 'none');
            tarteaucitron.userInterface.css(c + 'AlertSmall', 'display', 'block');
            tarteaucitron.userInterface.css(c + 'Icon', 'display', 'block');
            tarteaucitron.userInterface.css(c + 'AlertBig',   'display', 'none');
            tarteaucitron.userInterface.removeClass(c + 'Root',   'tarteaucitronBeforeVisible');
            tarteaucitron.userInterface.jsSizing('box');

            //ie compatibility
            var tacCloseAlertEvent;
            if(typeof(Event) === 'function') {
                tacCloseAlertEvent = new Event("tac.close_alert");
            }else if (typeof(document.createEvent) === 'function'){
                tacCloseAlertEvent = document.createEvent('Event');
                tacCloseAlertEvent.initEvent("tac.close_alert", true, true);
            }
            //end ie compatibility

            if (typeof(window.dispatchEvent) === 'function') {window.dispatchEvent(tacCloseAlertEvent);}
        },
        "toggleCookiesList": function () {
            "use strict";
            var div = document.getElementById('tarteaucitronCookiesListContainer'),
                togglediv = document.getElementById('tarteaucitronCookiesNumber');

            if (div === null) {
                return;
            }

            if (div.style.display !== 'block') {
                tarteaucitron.cookie.number();
                div.style.display = 'block';
                togglediv.setAttribute("aria-expanded", "true");
                tarteaucitron.userInterface.jsSizing('cookie');
                tarteaucitron.userInterface.css('tarteaucitron', 'display', 'none');
                tarteaucitron.userInterface.css('tarteaucitronBack', 'display', 'block');
                tarteaucitron.fallback(['tarteaucitronInfoBox'], function (elem) {
                    elem.style.display = 'none';
                }, true);
            } else {
                div.style.display = 'none';
                togglediv.setAttribute("aria-expanded", "false");
                tarteaucitron.userInterface.css('tarteaucitron', 'display', 'none');
                tarteaucitron.userInterface.css('tarteaucitronBack', 'display', 'none');
            }
        },
        "toggle": function (id, closeClass) {
            "use strict";
            var div = document.getElementById(id);

            if (div === null) {
                return;
            }

            if (closeClass !== undefined) {
                tarteaucitron.fallback([closeClass], function (elem) {
                    if (elem.id !== id) {
                        elem.style.display = 'none';
                    }
                }, true);
            }

            if (div.style.display !== 'block') {
                div.style.display = 'block';
            } else {
                div.style.display = 'none';
            }
        },
        "order": function (id) {
            "use strict";
            var main = document.getElementById('tarteaucitronServices_' + id),
                allDivs,
                store = [],
                i;

            if (main === null) {
                return;
            }

            allDivs = main.childNodes;

            if (typeof Array.prototype.map === 'function' && typeof Enumerable === 'undefined') {
                Array.prototype.map.call(main.children, Object).sort(function (a, b) {
                //var mainChildren = Array.from(main.children);
                //mainChildren.sort(function (a, b) {
                    if (tarteaucitron.services[a.id.replace(/Line/g, '')].name > tarteaucitron.services[b.id.replace(/Line/g, '')].name) { return 1; }
                    if (tarteaucitron.services[a.id.replace(/Line/g, '')].name < tarteaucitron.services[b.id.replace(/Line/g, '')].name) { return -1; }
                    return 0;
                }).forEach(function (element) {
                    main.appendChild(element);
                });
            }
        },
        "jsSizing": function (type) {
            "use strict";
            var scrollbarMarginRight = 10,
                scrollbarWidthParent,
                scrollbarWidthChild,
                servicesHeight,
                e = window,
                a = 'inner',
                windowInnerHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight,
                mainTop,
                mainHeight,
                closeButtonHeight,
                headerHeight,
                cookiesListHeight,
                cookiesCloseHeight,
                cookiesTitleHeight,
                paddingBox,
                alertSmallHeight,
                cookiesNumberHeight;

            if (type === 'box') {
                if (document.getElementById('tarteaucitronAlertSmall') !== null && document.getElementById('tarteaucitronCookiesNumber') !== null) {

                    // reset
                    tarteaucitron.userInterface.css('tarteaucitronCookiesNumber', 'padding', '0px 10px');

                    // calculate
                    alertSmallHeight = document.getElementById('tarteaucitronAlertSmall').offsetHeight;
                    cookiesNumberHeight = document.getElementById('tarteaucitronCookiesNumber').offsetHeight;
                    paddingBox = (alertSmallHeight - cookiesNumberHeight) / 2;

                    // apply
                    tarteaucitron.userInterface.css('tarteaucitronCookiesNumber', 'padding', paddingBox + 'px 10px');
                }
            } else if (type === 'main') {

                // get the real window width for media query
                if (window.innerWidth === undefined) {
                    a = 'client';
                    e = document.documentElement || document.body;
                }

                // height of the services list container
                if (document.getElementById('tarteaucitron') !== null && document.getElementById('tarteaucitronClosePanel') !== null && document.getElementById('tarteaucitronMainLineOffset') !== null) {

                    // reset
                    tarteaucitron.userInterface.css('tarteaucitronServices', 'height', 'auto');

                    // calculate
                    mainHeight = document.getElementById('tarteaucitron').offsetHeight;
                    closeButtonHeight = document.getElementById('tarteaucitronClosePanel').offsetHeight;

                    // apply
                    servicesHeight = (mainHeight - closeButtonHeight + 2);
                    tarteaucitron.userInterface.css('tarteaucitronServices', 'height', servicesHeight + 'px');
                    tarteaucitron.userInterface.css('tarteaucitronServices', 'overflow-x', 'auto');
                }

                // align the main allow/deny button depending on scrollbar width
                if (document.getElementById('tarteaucitronServices') !== null && document.getElementById('tarteaucitronScrollbarChild') !== null) {

                    // media query
                    if (e[a + 'Width'] <= 479) {
                        //tarteaucitron.userInterface.css('tarteaucitronScrollbarAdjust', 'marginLeft', '11px');
                    } else if (e[a + 'Width'] <= 767) {
                        scrollbarMarginRight = 12;
                    }

                    scrollbarWidthParent = document.getElementById('tarteaucitronServices').offsetWidth;
                    scrollbarWidthChild = document.getElementById('tarteaucitronScrollbarChild').offsetWidth;
                    //tarteaucitron.userInterface.css('tarteaucitronScrollbarAdjust', 'marginRight', ((scrollbarWidthParent - scrollbarWidthChild) + scrollbarMarginRight) + 'px');
                }

                // center the main panel
                if (document.getElementById('tarteaucitron') !== null) {

                    // media query
                    if (e[a + 'Width'] <= 767) {
                        mainTop = 0;
                    } else {
                        mainTop = ((windowInnerHeight - document.getElementById('tarteaucitron').offsetHeight) / 2) - 21;
                    }

                    if (document.getElementById('tarteaucitronMainLineOffset') !== null) {
                        if (document.getElementById('tarteaucitron').offsetHeight < (windowInnerHeight / 2)) {
                            mainTop -= document.getElementById('tarteaucitronMainLineOffset').offsetHeight;
                        }
                    }

                    // correct
                    if (mainTop < 0) {
                        mainTop = 0;
                    }

                    // apply
                    tarteaucitron.userInterface.css('tarteaucitron', 'top', mainTop + 'px');
                }


            } else if (type === 'cookie') {

                // put cookies list at bottom
                if (document.getElementById('tarteaucitronAlertSmall') !== null) {
                    tarteaucitron.userInterface.css('tarteaucitronCookiesListContainer', 'bottom', (document.getElementById('tarteaucitronAlertSmall').offsetHeight) + 'px');
                }

                // height of cookies list
                if (document.getElementById('tarteaucitronCookiesListContainer') !== null) {

                    // reset
                    tarteaucitron.userInterface.css('tarteaucitronCookiesList', 'height', 'auto');

                    // calculate
                    cookiesListHeight = document.getElementById('tarteaucitronCookiesListContainer').offsetHeight;
                    cookiesCloseHeight = document.getElementById('tarteaucitronClosePanelCookie').offsetHeight;
                    cookiesTitleHeight = document.getElementById('tarteaucitronCookiesTitle').offsetHeight;

                    // apply
                    tarteaucitron.userInterface.css('tarteaucitronCookiesList', 'height', (cookiesListHeight - cookiesCloseHeight - cookiesTitleHeight - 2) + 'px');
                }
            }
        }
    },
    "cookie": {
        "owner": {},
        "create": function (key, status) {
            "use strict";

            if (tarteaucitronForceExpire !== '') {
                // The number of day(s)/hour(s) can't be higher than 1 year
                if ((tarteaucitronExpireInDay && tarteaucitronForceExpire < 365) || (!tarteaucitronExpireInDay && tarteaucitronForceExpire < 8760)) {
                    if (tarteaucitronExpireInDay) {
                        // Multiplication to tranform the number of days to milliseconds
                        timeExpire = tarteaucitronForceExpire * 86400000;
                    } else {
                        // Multiplication to tranform the number of hours to milliseconds
                        timeExpire = tarteaucitronForceExpire * 3600000;
                    }
                }
            }

            var d = new Date(),
                time = d.getTime(),
                expireTime = time + timeExpire, // 365 days
                regex = new RegExp("!" + key + "=(wait|true|false)", "g"),
                cookie = tarteaucitron.cookie.read().replace(regex, ""),
                value = tarteaucitron.parameters.cookieName + '=' + cookie + '!' + key + '=' + status,
                domain = (tarteaucitron.parameters.cookieDomain !== undefined && tarteaucitron.parameters.cookieDomain !== '') ? '; domain=' + tarteaucitron.parameters.cookieDomain : '',
                secure = location.protocol === 'https:' ? '; Secure' : '';

            d.setTime(expireTime);
            document.cookie = value + '; expires=' + d.toGMTString() + '; path=/' + domain + secure + '; samesite=lax';
        },
        "read": function () {
            "use strict";
            var nameEQ = tarteaucitron.parameters.cookieName + "=",
                ca = document.cookie.split(';'),
                i,
                c;

            for (i = 0; i < ca.length; i += 1) {
                c = ca[i];
                while (c.charAt(0) === ' ') {
                    c = c.substring(1, c.length);
                }
                if (c.indexOf(nameEQ) === 0) {
                    return c.substring(nameEQ.length, c.length);
                }
            }
            return '';
        },
        "purge": function (arr) {
            "use strict";
            var i;

            for (i = 0; i < arr.length; i += 1) {

                var rgxpCookie = new RegExp("^(.*;)?\\s*" + arr[i] + "\\s*=\\s*[^;]+(.*)?$");
                if (document.cookie.match(rgxpCookie)) {
                    document.cookie = arr[i] + '=; expires=Thu, 01 Jan 2000 00:00:00 GMT; path=/;';
                    document.cookie = arr[i] + '=; expires=Thu, 01 Jan 2000 00:00:00 GMT; path=/; domain=.' + location.hostname + ';';
                    document.cookie = arr[i] + '=; expires=Thu, 01 Jan 2000 00:00:00 GMT; path=/; domain=.' + location.hostname.split('.').slice(-2).join('.') + ';';
                }
            }
        },
        "checkCount": function (key) {
            "use strict";
            var arr = tarteaucitron.services[key].cookies,
                nb = arr.length,
                nbCurrent = 0,
                html = '',
                i,
                status = document.cookie.indexOf(key + '=true');

            if (status >= 0 && nb === 0) {
                html += tarteaucitron.lang.useNoCookie;
            } else if (status >= 0) {
                for (i = 0; i < nb; i += 1) {
                    if (document.cookie.indexOf(arr[i] + '=') !== -1) {
                        nbCurrent += 1;
                        if (tarteaucitron.cookie.owner[arr[i]] === undefined) {
                            tarteaucitron.cookie.owner[arr[i]] = [];
                        }
                        if (tarteaucitron.cookie.crossIndexOf(tarteaucitron.cookie.owner[arr[i]], tarteaucitron.services[key].name) === false) {
                            tarteaucitron.cookie.owner[arr[i]].push(tarteaucitron.services[key].name);
                        }
                    }
                }

                if (nbCurrent > 0) {
                    html += tarteaucitron.lang.useCookieCurrent + ' ' + nbCurrent + ' cookie';
                    if (nbCurrent > 1) {
                        html += 's';
                    }
                    html += '.';
                } else {
                    html += tarteaucitron.lang.useNoCookie;
                }
            } else if (nb === 0) {
                html = tarteaucitron.lang.noCookie;
            } else {
                html += tarteaucitron.lang.useCookie + ' ' + nb + ' cookie';
                if (nb > 1) {
                    html += 's';
                }
                html += '.';
            }

            if (document.getElementById('tacCL' + key) !== null) {
                if (drupalSettings.tacjs.services[key] !== undefined && drupalSettings.tacjs.services[key].readMore !== '' ) {
                    document.getElementById('tacCL' + key).innerHTML = drupalSettings.tacjs.services[key].readMore + '<br>' + html;
                } else {
                    document.getElementById('tacCL' + key).innerHTML = html;
                }
            }
        },
        "crossIndexOf": function (arr, match) {
            "use strict";
            var i;
            for (i = 0; i < arr.length; i += 1) {
                if (arr[i] === match) {
                    return true;
                }
            }
            return false;
        },
        "number": function () {
            "use strict";
            var cookies = document.cookie.split(';'),
                nb = (document.cookie !== '') ? cookies.length : 0,
                html = '',
                i,
                name,
                namea,
                nameb,
                c,
                d,
                s = (nb > 1) ? 's' : '',
                savedname,
                regex = /^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i,
                regexedDomain = (tarteaucitron.cdn.match(regex) !== null) ? tarteaucitron.cdn.match(regex)[1] : tarteaucitron.cdn,
                host = (tarteaucitron.domain !== undefined) ? tarteaucitron.domain : regexedDomain;

            cookies = cookies.sort(function (a, b) {
                namea = a.split('=', 1).toString().replace(/ /g, '');
                nameb = b.split('=', 1).toString().replace(/ /g, '');
                c = (tarteaucitron.cookie.owner[namea] !== undefined) ? tarteaucitron.cookie.owner[namea] : '0';
                d = (tarteaucitron.cookie.owner[nameb] !== undefined) ? tarteaucitron.cookie.owner[nameb] : '0';
                if (c + a > d + b) { return 1; }
                if (c + a < d + b) { return -1; }
                return 0;
            });

            if (document.cookie !== '') {
                for (i = 0; i < nb; i += 1) {
                    name = cookies[i].split('=', 1).toString().replace(/ /g, '');
                    if (tarteaucitron.cookie.owner[name] !== undefined && tarteaucitron.cookie.owner[name].join(' // ') !== savedname) {
                        savedname = tarteaucitron.cookie.owner[name].join(' // ');
                        html += '<div class="tarteaucitronHidden">';
                        html += '     <span class="tarteaucitronTitle tarteaucitronH3" role="heading" aria-level="3">';
                        html += '        ' + tarteaucitron.cookie.owner[name].join(' // ');
                        html += '    </span>';
                        html += '</div><ul class="cookie-list">';
                    } else if (tarteaucitron.cookie.owner[name] === undefined && host !== savedname) {
                        savedname = host;
                        html += '<div class="tarteaucitronHidden">';
                        html += '     <span class="tarteaucitronTitle tarteaucitronH3" role="heading" aria-level="3">';
                        html += '        ' + host;
                        html += '    </span>';
                        html += '</div><ul class="cookie-list">';
                    }
                    html += '<li class="tarteaucitronCookiesListMain">';
                    html += '    <div class="tarteaucitronCookiesListLeft"><button type="button" class="purgeBtn" data-cookie="' + tarteaucitron.fixSelfXSS(cookies[i].split('=', 1)) + '"><strong>&times;</strong></button> <strong>' + tarteaucitron.fixSelfXSS(name) + '</strong>';
                    html += '    </div>';
                    html += '    <div class="tarteaucitronCookiesListRight">' + tarteaucitron.fixSelfXSS(cookies[i].split('=').slice(1).join('=')) + '</div>';
                    html += '</li>';
                }
                html += '</ul>';
            } else {
                html += '<div class="tarteaucitronCookiesListMain">';
                html += '    <div class="tarteaucitronCookiesListLeft"><strong>-</strong></div>';
                html += '    <div class="tarteaucitronCookiesListRight"></div>';
                html += '</div>';
            }

            html += '<div class="tarteaucitronHidden tarteaucitron-spacer-20"></div>';

            if (document.getElementById('tarteaucitronCookiesList') !== null) {
                document.getElementById('tarteaucitronCookiesList').innerHTML = html;
            }

            if (document.getElementById('tarteaucitronCookiesNumber') !== null) {
                document.getElementById('tarteaucitronCookiesNumber').innerHTML = nb;
                document.getElementById('tarteaucitronCookiesNumber').setAttribute("aria-label", nb + ' cookie' + s + " - " + tarteaucitron.lang.toggleInfoBox);
                document.getElementById('tarteaucitronCookiesNumber').setAttribute("title", nb + ' cookie' + s + " - " + tarteaucitron.lang.toggleInfoBox);
            }

            if (document.getElementById('tarteaucitronCookiesNumberBis') !== null) {
                document.getElementById('tarteaucitronCookiesNumberBis').innerHTML = nb + ' cookie' + s;
            }

            var purgeBtns = document.getElementsByClassName("purgeBtn");
            for (i = 0; i < purgeBtns.length; i++) {
                tarteaucitron.addClickEventToElement(purgeBtns[i], function () {
                    tarteaucitron.cookie.purge([this.dataset.cookie]);
                    tarteaucitron.cookie.number();
                    tarteaucitron.userInterface.jsSizing('cookie');
                    return false;
                });
            }

            for (i = 0; i < tarteaucitron.job.length; i += 1) {
                tarteaucitron.cookie.checkCount(tarteaucitron.job[i]);
            }
        }
    },
    "fixSelfXSS": function(html) {
        return html.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    },
    "getLanguage": function () {
        "use strict";

        var availableLanguages = 'ar,bg,ca,cn,cs,da,de,et,el,en,es,fi,fr,hu,it,ja,lt,lv,nl,no,oc,pl,pt,ro,ru,se,sk,sv,tr,uk,vi,zh',
            defaultLanguage = 'en';

        if (tarteaucitronForceLanguage !== '') {
            if (availableLanguages.indexOf(tarteaucitronForceLanguage) !== -1) {
                return tarteaucitronForceLanguage;
            }
        }

        // get the html lang
        if (availableLanguages.indexOf(document.documentElement.getAttribute("lang")) !== -1) {
            return document.documentElement.getAttribute("lang");
        }

        if (!navigator) { return defaultLanguage; }

        var lang = navigator.language || navigator.browserLanguage ||
                navigator.systemLanguage || navigator.userLang || null,
            userLanguage = lang ? lang.substr(0, 2) : null;

        if (availableLanguages.indexOf(userLanguage) !== -1) {
            return userLanguage;
        }

        return defaultLanguage;
    },
    "getLocale": function () {
        "use strict";
        if (!navigator) { return 'en_US'; }

        var lang = navigator.language || navigator.browserLanguage ||
                navigator.systemLanguage || navigator.userLang || null,
            userLanguage = lang ? lang.substr(0, 2) : null;

        if (userLanguage === 'fr') {
            return 'fr_FR';
        } else if (userLanguage === 'en') {
            return 'en_US';
        } else if (userLanguage === 'de') {
            return 'de_DE';
        } else if (userLanguage === 'es') {
            return 'es_ES';
        } else if (userLanguage === 'it') {
            return 'it_IT';
        } else if (userLanguage === 'pt') {
            return 'pt_PT';
        } else if (userLanguage === 'nl') {
            return 'nl_NL';
        } else if (userLanguage === 'el') {
            return 'el_EL';
        } else {
            return 'en_US';
        }
    },
    "addScript": function (url, id, callback, execute, attrName, attrVal, internal) {
        "use strict";
        var script,
            done = false;

        if (execute === false) {
            if (typeof callback === 'function') {
                callback();
            }
        } else {
            script = document.createElement('script');
            script.id = (id !== undefined) ? id : '';
            script.async = true;
            script.src = url;

            if (attrName !== undefined && attrVal !== undefined) {
                script.setAttribute(attrName, attrVal);
            }

            if (typeof callback === 'function') {
                if ( !tarteaucitron.parameters.useExternalJs || !internal ) {
                    script.onreadystatechange = script.onload = function () {
                        var state = script.readyState;
                        if (!done && (!state || /loaded|complete/.test(state))) {
                            done = true;
                            callback();
                        }
                    };
                } else {
                    callback();
                }
            }

            if ( !tarteaucitron.parameters.useExternalJs || !internal ) {
                document.getElementsByTagName('head')[0].appendChild(script);
            }
        }
    },
    "addInternalScript": function (url, id, callback, execute, attrName, attrVal) {
        tarteaucitron.addScript(url, id, callback, execute, attrName, attrVal, true);
    },
    "checkIfExist": function (elemId) {
        "use strict";
        return document.getElementById(elemId) !== null && document.getElementById(elemId).offsetWidth !== 0 && document.getElementById(elemId).offsetHeight !== 0;
    },
    "makeAsync": {
        "antiGhost": 0,
        "buffer": '',
        "init": function (url, id) {
            "use strict";
            var savedWrite = document.write,
                savedWriteln = document.writeln;

            document.write = function (content) {
                tarteaucitron.makeAsync.buffer += content;
            };
            document.writeln = function (content) {
                tarteaucitron.makeAsync.buffer += content.concat("\n");
            };

            setTimeout(function () {
                document.write = savedWrite;
                document.writeln = savedWriteln;
            }, 20000);

            tarteaucitron.makeAsync.getAndParse(url, id);
        },
        "getAndParse": function (url, id) {
            "use strict";
            if (tarteaucitron.makeAsync.antiGhost > 9) {
                tarteaucitron.makeAsync.antiGhost = 0;
                return;
            }
            tarteaucitron.makeAsync.antiGhost += 1;
            tarteaucitron.addInternalScript(url, '', function () {
                if (document.getElementById(id) !== null) {
                    document.getElementById(id).innerHTML += "<span class='tarteaucitron-display-none'>&nbsp;</span>" + tarteaucitron.makeAsync.buffer;
                    tarteaucitron.makeAsync.buffer = '';
                    tarteaucitron.makeAsync.execJS(id);
                }
            });
        },
        "execJS": function (id) {
            /* not strict because third party scripts may have errors */
            var i,
                scripts,
                childId,
                type;

            if (document.getElementById(id) === null) {
                return;
            }

            scripts = document.getElementById(id).getElementsByTagName('script');
            for (i = 0; i < scripts.length; i += 1) {
                type = (scripts[i].getAttribute('type') !== null) ? scripts[i].getAttribute('type') : '';
                if (type === '') {
                    type = (scripts[i].getAttribute('language') !== null) ? scripts[i].getAttribute('language') : '';
                }
                if (scripts[i].getAttribute('src') !== null && scripts[i].getAttribute('src') !== '') {
                    childId = id + Math.floor(Math.random() * 99999999999);
                    document.getElementById(id).innerHTML += '<div id="' + childId + '"></div>';
                    tarteaucitron.makeAsync.getAndParse(scripts[i].getAttribute('src'), childId);
                } else if (type.indexOf('javascript') !== -1 || type === '') {
                    eval(scripts[i].innerHTML);
                }
            }
        }
    },
    "fallback": function (matchClass, content, noInner) {
        "use strict";
        var elems = document.getElementsByTagName('*'),
            i,
            index = 0;

        for (i in elems) {
            if (elems[i] !== undefined) {
                for (index = 0; index < matchClass.length; index += 1) {
                    if ((' ' + elems[i].className + ' ')
                            .indexOf(' ' + matchClass[index] + ' ') > -1) {
                        if (typeof content === 'function') {
                            if (noInner === true) {
                                content(elems[i]);
                            } else {
                                elems[i].innerHTML = content(elems[i]);
                            }
                        } else {
                            elems[i].innerHTML = content;
                        }
                    }
                }
            }
        }
    },
    "engage": function (id) {
        "use strict";
        var html = '',
            r = Math.floor(Math.random() * 100000),
            engage = tarteaucitron.services[id].name + ' ' + tarteaucitron.lang.fallback;

        if (tarteaucitron.lang['engage-' + id] !== undefined) {
            engage = tarteaucitron.lang['engage-' + id];
        }

        html += '<div class="tac_activate tac_activate_' + id + '">';
        html += '   <div class="tac_float">';
        html += '      ' + engage;
        html += '      <button type="button" class="tarteaucitronAllow" id="Eng' + r + 'ed' + id + '">';
        html += '          <span class="tarteaucitronCheck" aria-hidden="true"></span> ' + tarteaucitron.lang.allow;
        html += '       </button>';
        html += '   </div>';
        html += '</div>';

        return html;
    },
    "extend": function (a, b) {
        "use strict";
        var prop;
        for (prop in b) {
            if (b.hasOwnProperty(prop)) {
                a[prop] = b[prop];
            }
        }
    },
    "proTemp": '',
    "proTimer": function () {
        "use strict";
        setTimeout(tarteaucitron.proPing, 500);
    },
    "pro": function (list) {
        "use strict";
        tarteaucitron.proTemp += list;
        clearTimeout(tarteaucitron.proTimer);
        tarteaucitron.proTimer = setTimeout(tarteaucitron.proPing, 500);
    },
    "proPing": function () {
        "use strict";
        if (tarteaucitron.uuid !== '' && tarteaucitron.uuid !== undefined && tarteaucitron.proTemp !== '' && tarteaucitronStatsEnabled) {
            var div = document.getElementById('tarteaucitronPremium'),
                timestamp = new Date().getTime(),
                url = 'https://tarteaucitron.io/log/?';

            if (div === null) {
                return;
            }

            url += 'account=' + tarteaucitron.uuid + '&';
            url += 'domain=' + tarteaucitron.domain + '&';
            url += 'status=' + encodeURIComponent(tarteaucitron.proTemp) + '&';
            url += '_time=' + timestamp;

            div.innerHTML = '<img src="' + url + '" class="tarteaucitron-display-none" alt="" />';

            tarteaucitron.proTemp = '';
        }

        tarteaucitron.cookie.number();
    },
    "AddOrUpdate" : function(source, custom){
        /**
         Utility function to Add or update the fields of obj1 with the ones in obj2
         */
        for(var key in custom){
            if(custom[key] instanceof Object){
                source[key] = tarteaucitron.AddOrUpdate(source[key], custom[key]);
            }else{
                source[key] = custom[key];
            }
        }
        return source;
    },
    "getElemWidth": function(elem) {
        return elem.getAttribute('width') || elem.clientWidth;
    },
    "getElemHeight": function(elem) {
        return elem.getAttribute('height') || elem.clientHeight;
    },
    "getElemAttr": function (elem, attr) {
        return elem.getAttribute('data-' + attr) || elem.getAttribute(attr);
    },
    "addClickEventToId": function (elemId, func) {
        tarteaucitron.addClickEventToElement(document.getElementById(elemId), func);
    },
    "addClickEventToElement": function (e, func) {
        if (e) {
            if (e.addEventListener) {
                e.addEventListener("click", func);
            } else {
                e.attachEvent("onclick", func);
            }
        }
    },
    "triggerJobsAfterAjaxCall": function() {
        tarteaucitron.job.forEach(function(e) { tarteaucitron.job.push(e) });
        var i;
        var allowBtns = document.getElementsByClassName("tarteaucitronAllow");
        for (i = 0; i < allowBtns.length; i++) {
            tarteaucitron.addClickEventToElement(allowBtns[i], function () {
                tarteaucitron.userInterface.respond(this, true);
            });
        }
        var denyBtns = document.getElementsByClassName("tarteaucitronDeny");
        for (i = 0; i < denyBtns.length; i++) {
            tarteaucitron.addClickEventToElement(denyBtns[i], function () {
                tarteaucitron.userInterface.respond(this, false);
            });
        }
    }
};
;
/*global tarteaucitron, ga, Shareaholic, stLight, clicky, top, google, Typekit, FB, ferankReady, IN, stButtons, twttr, PCWidget*/
/*jslint regexp: true, nomen: true*/

// generic iframe
tarteaucitron.services.iframe = {
    "key": "iframe",
    "type": "other",
    "name": "Web content",
    "uri": "",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";
        tarteaucitron.fallback(['tac_iframe'], function (x) {
            var frame_title = (tarteaucitron.getElemAttr(x,"title")) ? tarteaucitron.fixSelfXSS(tarteaucitron.getElemAttr(x,"title")) : '',
                width = tarteaucitron.getElemAttr(x,"width"),
                height = tarteaucitron.getElemAttr(x,"height"),
                allowfullscreen = tarteaucitron.getElemAttr(x,"allowfullscreen"),
                url = tarteaucitron.getElemAttr(x,"url");

            return '<iframe title="' + frame_title + '" src="' + url + '" width="' + width + '" height="' + height + '" scrolling="no" allowtransparency' + (allowfullscreen == '0' ? '' : ' webkitallowfullscreen mozallowfullscreen allowfullscreen') + '></iframe>';
        });
    },
    "fallback": function () {
        "use strict";
        var id = 'iframe';
        tarteaucitron.fallback(['tac_iframe'], function (elem) {
            elem.style.width = tarteaucitron.getElemAttr(elem,'width') + 'px';
            elem.style.height = tarteaucitron.getElemAttr(elem,'height') + 'px';
            return tarteaucitron.engage(id);
        });
    }
};

// kwanko
tarteaucitron.services.kwanko = {
    "key": "kwanko",
    "type": "ads",
    "name": "Kwanko",
    "uri": "https://www.kwanko.com/fr/rgpd/politique-gestion-donnees/",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";
        tarteaucitron.fallback(['tac_kwanko'], function (x) {
            var mclic = x.getAttribute("data-mclic");

            return '<img src="https://action.metaffiliation.com/trk.php?mclic=' + mclic + '" width="1" height="1" border="0" />';
        });
    },
    "fallback": function () {
        "use strict";
        var id = 'kwanko';
        tarteaucitron.fallback(['tac_kwanko'], function (elem) {
            return tarteaucitron.engage(id);
        });
    }
};

// leadforensics
tarteaucitron.services.leadforensics = {
    "key": "leadforensics",
    "type": "ads",
    "name": "Lead Forensics",
    "uri": "https://www.leadforensics.com/cookie-policy/",
    "needConsent": true,
    "cookies": ['ifuuid'],
    "js": function () {
        "use strict";
        if (tarteaucitron.user.leadforensicsId === undefined) {
            return;
        }

        tarteaucitron.addScript('https://secure.team8save.com/js/sc/'+ tarteaucitron.user.leadforensicsId +'.js');
    }
};

// ubib
tarteaucitron.services.ubib = {
    "key": "ubib",
    "type": "support",
    "name": "Ubib Chatbot",
    "uri": "https://ubib.libanswers.com/",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";

        if (tarteaucitron.user.ubibId === undefined || tarteaucitron.user.ubibHash === undefined) {
            return;
        }

        tarteaucitron.addScript('https://' + tarteaucitron.user.ubibId + '.libanswers.com/load_chat.php?hash=' + tarteaucitron.user.ubibHash);
    }
};

// wysistathightrack
tarteaucitron.services.wysistathightrack = {
    "key": "wysistathightrack",
    "type": "analytic",
    "name": "Wysistat (privacy by design)",
    "uri": "https://www.wysistat.net/webanalytics/exemption-cnil/",
    "needConsent": false,
    "cookies": ['wysistat'],
    "js": function () {
        "use strict";

        if (tarteaucitron.user.wysistatNom === undefined) {
            return;
        }

        window._wsq = window._wsq || [];
        window._wsq.push(['_setNom', tarteaucitron.user.wysistatNom]);
        window._wsq.push(['_wysistat']);

        tarteaucitron.addScript('https://www.wysistat.com/ws.jsa');
    }
};

// robofabrica
tarteaucitron.services.robofabrica = {
    "key": "robofabrica",
    "type": "support",
    "name": "Robo Fabrica Chatbot",
    "uri": "https://robofabrica.tech/charte-vie-privee/",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";

        if (tarteaucitron.user.robofabricaUuid === undefined) {
            return;
        }

        tarteaucitron.addScript('https://app.robofabrica.tech/widget/script', 'inceptive-cw-script', function() {

            document.getElementById('inceptive-cw-script').setAttribute('unique-url', tarteaucitron.user.robofabricaUuid);
            document.getElementById('inceptive-cw-script').setAttribute('label', 'start');
            document.getElementById('inceptive-cw-script').setAttribute('launch-btn-id', 'inceptive-cw-launch');
            document.getElementById('inceptive-cw-script').setAttribute('chat-server-url', 'https://app.robofabrica.tech:443');

        });
    }
};

// trustpilot
tarteaucitron.services.trustpilot = {
    "key": "trustpilot",
    "type": "other",
    "name": "Trustpilot",
    "uri": "https://fr.legal.trustpilot.com/for-reviewers/end-user-privacy-terms",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";
        tarteaucitron.fallback(['trustpilot-widget'], '');
        tarteaucitron.addScript('https://widget.trustpilot.com/bootstrap/v5/tp.widget.sync.bootstrap.min.js');
    },
    "fallback": function () {
        "use strict";
        var id = 'trustpilot';
        tarteaucitron.fallback(['trustpilot-widget'], function (elem) {
            elem.style.width = elem.getAttribute('data-style-width');
            elem.style.height = elem.getAttribute('data-style-height');
            return tarteaucitron.engage(id);
        });
    }
};

// snapchat
tarteaucitron.services.snapchat = {
    "key": "snapchat",
    "type": "analytic",
    "name": "Snapchat",
    "uri": "https://snap.com/fr-FR/privacy/privacy-policy",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";

        if (tarteaucitron.user.snapchatId === undefined || tarteaucitron.user.snapchatEmail === undefined) {
            return;
        }

	var a = window.snaptr = function() {
		a.handleRequest ? a.handleRequest.apply(a, arguments) : a.queue.push(arguments)
	};
	a.queue = [];
        window.snaptr('init', tarteaucitron.user.snapchatId, {
	    'user_email': tarteaucitron.user.snapchatEmail
        });
        window.snaptr('track', 'PAGE_VIEW');

        tarteaucitron.addScript('https://sc-static.net/scevent.min.js');
	    
	if (typeof tarteaucitron.user.snapchatMore === 'function') {
            tarteaucitron.user.snapchatMore();
        }
    }
};

// antvoice
tarteaucitron.services.antvoice = {
    "key": "antvoice",
    "type": "ads",
    "name": "antvoice",
    "uri": "https://www.antvoice.com/fr/privacy-policy/",
    "needConsent": true,
    "cookies": ['antvoice'],
    "js": function () {
        "use strict";

        if (tarteaucitron.user.antvoiceId === undefined) {
            return;
        }

        window.avDataLayer = window.avDataLayer || [];
        window.avtag = window.avtag || function(_cmd,_p) {
            window.avDataLayer.push({cmd:_cmd,p:_p});
        }
        window.avtag('setConsent', {consent:true});
        window.avtag('init', {id: tarteaucitron.user.antvoiceId});

        tarteaucitron.addScript('https://static.avads.net/avtag.min.js');
    }
};

// plausible
tarteaucitron.services.plausible = {
    "key": "plausible",
    "type": "analytic",
    "name": "Plausible",
    "uri": "https://plausible.io/privacy",
    "needConsent": false,
    "cookies": [],
    "js": function () {
        "use strict";

        if (tarteaucitron.user.plausibleDomain === undefined) {
            return;
        }

        tarteaucitron.addScript('https://plausible.io/js/script.js', '', '', '', 'data-domain', tarteaucitron.user.plausibleDomain);
    }
};

// videas
tarteaucitron.services.videas = {
    "key": "videas",
    "type": "video",
    "name": "Videas",
    "uri": "https://videas.fr/fr/legal",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";
        tarteaucitron.fallback(['tac_videas'], function (x) {
            var frame_title = tarteaucitron.fixSelfXSS(x.getAttribute("title") || 'Videas iframe'),
                width = x.getAttribute("width"),
                height = x.getAttribute("height"),
                id = x.getAttribute("data-id"),
                allowfullscreen = x.getAttribute("allowfullscreen");

            return '<iframe title="' + frame_title + '" src="https://app.videas.fr/embed/' + id + '/" width="' + width + '" height="' + height + '" allowtransparency ' + (allowfullscreen == '0' ? '' : ' webkitallowfullscreen mozallowfullscreen allowfullscreen') + '></iframe>';
        });
    },
    "fallback": function () {
        "use strict";
        var id = 'videas';
        tarteaucitron.fallback(['tac_videas'], function (elem) {
            elem.style.width = elem.getAttribute('width') + 'px';
            elem.style.height = elem.getAttribute('height') + 'px';
            return tarteaucitron.engage(id);
        });
    }
};

// myfeelback
tarteaucitron.services.myfeelback = {
    "key": "myfeelback",
    "type": "api",
    "name": "MyFeelBack (Skeepers)",
    "uri": "https://help.myfeelback.com/fr/quels-sont-les-cookies-d%C3%A9pos%C3%A9s-par-un-dispositif-de-collecte-myfeelback",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";
        if (tarteaucitron.user.myfeelbackId === undefined) {
            return;
        }

        window._Mfb_useCookie = true;
        window._Mfb_ud = {
            var1: undefined,
            var2: undefined,
            varN: undefined,
            _context: {
                lang: undefined,
                privacyMode: false,
                _page: {
                    url: location.pathname,
                    storageDuration: 30
                }
            }
        };
        tarteaucitron.addScript('https://actorssl-5637.kxcdn.com/actor/'+tarteaucitron.user.myfeelbackId+'/action', 'MFBActor');
    }
};

// arcio
tarteaucitron.services.arcio = {
    "key": "arcio",
    "type": "api",
    "name": "Arc.io",
    "uri": "https://arc.io/about",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";
        if (tarteaucitron.user.arcId === undefined) {
            return;
        }

        tarteaucitron.addScript('https://arc.io/widget.min.js#'+tarteaucitron.user.arcId);
    }
};

// doubleclick
tarteaucitron.services.doubleclick = {
    "key": "doubleclick",
    "type": "ads",
    "name": "DoubleClick",
    "uri": "https://support.google.com/admanager/answer/2839090",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";
        tarteaucitron.fallback(['doubleclick_container'], function (x) {
            var id1 = tarteaucitron.getElemAttr(x, "data-id1"),
                id2 = tarteaucitron.getElemAttr(x, "data-id2"),
                type = tarteaucitron.getElemAttr(x, "data-type"),
                cat = tarteaucitron.getElemAttr(x, "data-cat"),
                item = tarteaucitron.getElemAttr(x, "data-item"),
                quantity = tarteaucitron.getElemAttr(x, "data-quantity"),
                price = tarteaucitron.getElemAttr(x, "data-price"),
                postage = tarteaucitron.getElemAttr(x, "data-postage"),
                seller = tarteaucitron.getElemAttr(x, "data-seller"),
                gdpr = tarteaucitron.getElemAttr(x, "data-gdpr"),
                gdpr_consent = tarteaucitron.getElemAttr(x, "data-gdpr-consent"),
                ord = tarteaucitron.getElemAttr(x, "data-ord"),
                num = tarteaucitron.getElemAttr(x, "data-num");

            return '<iframe src="https://'+id1+'.fls.doubleclick.net/activityi;src='+id2+';type='+type+';cat='+cat+';item='+item+';quantity='+quantity+';price='+price+';postage='+postage+';seller='+seller+';gdpr='+gdpr+';gdpr_consent='+gdpr_consent+';num='+num+';ord='+ord+'?" width="1" height="1" frameborder="0" style="display:none"></iframe>';
        });
    }
};

// userpilot
tarteaucitron.services.userpilot = {
    "key": "userpilot",
    "type": "analytic",
    "name": "UserPilot",
    "uri": "https://userpilot.com/privacy-policy",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";
        if (tarteaucitron.user.userpilotToken === undefined) {
            return;
        }

        window.userpilotSettings = {token: tarteaucitron.user.userpilotToken};
        tarteaucitron.addScript('https://js.userpilot.io/sdk/latest.js');
    }
};

tarteaucitron.services.piwikpro = {
    "key": "piwikpro",
    "type": "analytic",
    "name": "Piwik Pro",
    "uri": "https://piwik.pro/privacy-policy/",
    "needConsent": true,
    "cookies": ['_pk_ref', '_pk_cvar', '_pk_id', '_pk_ses', '_pk_hsr', 'piwik_ignore', '_pk_uid'],
    "js": function () {
        "use strict";
        if (tarteaucitron.user.piwikProId === undefined) {
            return;
        }

        window['dataLayer'] = window['dataLayer'] || [], window['dataLayer'].push({
            start: (new Date).getTime(),
            event: "stg.start"
        });

        function stgCreateCookie(a, b, c) {
           var d = "";
           if (c) {
              var e = new Date;
              e.setTime(e.getTime() + 24 * c * 60 * 60 * 1e3), d = "; expires=" + e.toUTCString()
           }
           document.cookie = a + "=" + b + d + "; path=/"
        }

        var isStgDebug = (window.location.href.match("stg_debug") || document.cookie.match("stg_debug")) && !window.location.href.match("stg_disable_debug");
        stgCreateCookie("stg_debug", isStgDebug ? 1 : "", isStgDebug ? 14 : -1);
        var qP = [];

        var qPString = qP.length > 0 ? ("?" + qP.join("&")) : "";
        tarteaucitron.addScript('https://carsatse.containers.piwik.pro/'+tarteaucitron.user.piwikProId+'.js'+qPString);

        ! function(a, n, i) {
           a[n] = a[n] || {};
           for (var c = 0; c < i.length; c++) ! function(i) {
              a[n][i] = a[n][i] || {}, a[n][i].api = a[n][i].api || function() {
                 var a = [].slice.call(arguments, 0);
                 "string" == typeof a[0] && window['dataLayer'].push({
                    event: n + "." + i + ":" + a[0],
                    parameters: [].slice.call(arguments, 1)
                 })
              }
           }(i[c])
        }(window, "ppms", ["tm", "cm"]);
    }
};

// pinterestpixel
tarteaucitron.services.pinterestpixel = {
    "key": "pinterestpixel",
    "type": "ads",
    "name": "Pinterest Pixel",
    "uri": "https://help.pinterest.com/fr/business/article/track-conversions-with-pinterest-tag",
    "needConsent": true,
    "cookies": ['_pinterest_sess', '_pinterest_ct', '_pinterest_ct_mw', '_pinterest_ct_rt', '_epik', '_derived_epik', '_pin_unauth', '_pinterest_ct_ua'],
    "js": function () {
        "use strict";

        if (tarteaucitron.user.pinterestpixelId === undefined) {
            return;
        }

        if (!window.pintrk) {
            window.pintrk = function () {
                window.pintrk.queue.push(Array.prototype.slice.call(arguments));
            };

            var n = window.pintrk;
            n.queue = [];
            n.version = "3.0";

            tarteaucitron.addScript('https://s.pinimg.com/ct/core.js', '', function () {
                window.pintrk('load', tarteaucitron.user.pinterestpixelId);
                window.pintrk('page');
            });
        }
    }
};

// elfsight
tarteaucitron.services.elfsight = {
    "key": "elfsight",
    "type": "support",
    "name": "Elfsight",
    "uri": "https://elfsight.com/privacy-policy/",
    "needConsent": true,
    "cookies": ['__cfduid', '_p_hfp_client_id', 'session_id'],
    "js": function () {
        "use strict";

        tarteaucitron.addScript('https://apps.elfsight.com/p/platform.js');
    }
};

// plezi
tarteaucitron.services.plezi = {
    "key": "plezi",
    "type": "analytic",
    "name": "Plezi",
    "uri": "https://www.plezi.co/fr/mentions-legales/",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";

        if (tarteaucitron.user.pleziTenant === undefined || tarteaucitron.user.pleziTw === undefined) {
            return;
        }

        tarteaucitron.addScript('https://app.plezi.co/scripts/ossleads_analytics.js?tenant=' + tarteaucitron.user.pleziTenant + '&tw=' + tarteaucitron.user.pleziTw);
    }
};


// smartsupp
tarteaucitron.services.smartsupp = {
    "key": "smartsupp",
    "type": "support",
    "name": "Smartsupp",
    "uri": "https://www.smartsupp.com/help/privacy/",
    "needConsent": true,
    "cookies": ['ssupp.vid', 'ssupp.visits', 'AWSALB', 'AWSALBCORS'],
    "js": function () {
        "use strict";

        if (tarteaucitron.user.smartsuppKey === undefined) {
            return;
        }

        window._smartsupp = window._smartsupp || {};
        window._smartsupp.key = tarteaucitron.user.smartsuppKey;
        window.smartsupp = function () {
            window.smartsupp._.push(arguments)
        };
        window.smartsupp._ = [];

        tarteaucitron.addScript('https://www.smartsuppchat.com/loader.js');
    }
};



// sharpspring
tarteaucitron.services.sharpspring = {
    "key": "sharpspring",
    "type": "analytic",
    "name": "SharpSpring",
    "uri": "https://sharpspring.com/legal/sharpspring-cookie-policy/",
    "needConsent": true,
    "cookies": ['koitk', '__ss', '__ss_tk', '__ss_referrer'],
    "js": function () {
        "use strict";

        if (tarteaucitron.user.ssId === undefined || tarteaucitron.user.ssAccount === undefined) {
            return;
        }

        window._ss = window._ss || [];
        window._ss.push(['_setDomain', 'https://' + tarteaucitron.user.ssId + '.marketingautomation.services/net']);
        window._ss.push(['_setAccount', tarteaucitron.user.ssAccount]);
        window._ss.push(['_trackPageView']);

        window._pa = window._pa || {};

        tarteaucitron.addScript('https://' + tarteaucitron.user.ssId + '.marketingautomation.services/client/ss.js');
    }
};

// pardot
tarteaucitron.services.pardot = {
    "key": "pardot",
    "type": "analytic",
    "name": "Pardot",
    "uri": "https://www.salesforce.com/company/privacy/full_privacy/",
    "needConsent": true,
    "cookies": ['visitor_id'],
    "js": function () {
        "use strict";
        if (tarteaucitron.user.piAId === undefined || tarteaucitron.user.piCId === undefined) {
            return;
        }

        window.piAId = tarteaucitron.user.piAId;
        window.piCId = tarteaucitron.user.piCId;
        window.piHostname = 'pi.pardot.com';

        tarteaucitron.addScript('https://pi.pardot.com/pd.js');
    }
};

// Open Web Analytics
tarteaucitron.services.openwebanalytics = {
    "key": "openwebanalytics",
    "type": "analytic",
    "name": "Open Web Analytics",
    "uri": "",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";

        if (tarteaucitron.user.openwebanalyticsId === undefined || tarteaucitron.user.openwebanalyticsHost === undefined) {
            return;
        }

        window.owa_baseUrl = tarteaucitron.user.openwebanalyticsHost;
        window.owa_cmds = window.owa_cmds || [];
        window.owa_cmds.push(['setSiteId', tarteaucitron.user.openwebanalyticsId]);
        window.owa_cmds.push(['trackPageView']);
        window.owa_cmds.push(['trackClicks']);

        tarteaucitron.addScript(window.owa_baseUrl + 'modules/base/js/owa.tracker-combined-min.js');
    }
};

// xandr universal pixel
// https://docs.xandr.com/bundle/invest_invest-standard/page/topics/universal-pixel-overview.html
tarteaucitron.services.xandr = {
    "key": "xandr",
    "type": "ads",
    "name": "Xandr (Universal)",
    "uri": "https://www.xandr.com/privacy/cookie-policy/",
    "needConsent": true,
    "cookies": ['uuid2', 'uids', 'sess', 'icu', 'anj', 'usersync'],
    "js": function () {
        "use strict";
        if (tarteaucitron.user.xandrId === undefined) {
            return;
        }

        if (!window.pixie) {
            var n = window.pixie = function (e, i, a) {
                n.actionQueue.push({
                    action: e,
                    actionValue: i,
                    params: a
                })
            };
            n.actionQueue = [];
        }

        tarteaucitron.addScript('https://acdn.adnxs.com/dmp/up/pixie.js', '', function () {
            window.pixie('init', tarteaucitron.user.xandrId);
            window.pixie('event', 'PageView');
        });
    }
};

// xandr segment
// https://docs.xandr.com/bundle/invest_invest-standard/page/topics/segment-pixels-advanced.html
tarteaucitron.services.xandrsegment = {
    "key": "xandrsegment",
    "type": "ads",
    "name": "Xandr (Segment)",
    "uri": "https://www.xandr.com/privacy/cookie-policy/",
    "needConsent": true,
    "cookies": ['uuid2', 'uids', 'sess', 'icu', 'anj', 'usersync'],
    "js": function () {
        "use strict";
        var uniqIds = [],
            i,
            uri;

        tarteaucitron.fallback(['xandrsegment-canvas'], function (x) {
            var uniqId = '_' + Math.random().toString(36).substr(2, 9);
            uniqIds.push(uniqId);
            return '<div id="' + uniqId + '" xandrsegmentAdd="' + x.getAttribute('xandrsegmentAdd') + '" xandrsegmentAddCode="' + x.getAttribute('xandrsegmentAddCode') + '" xandrsegmentRemove="' + x.getAttribute('xandrsegmentRemove') + '" xandrsegmentRemoveCode="' + x.getAttribute('xandrsegmentRemoveCode') + '" xandrsegmentMember="' + x.getAttribute('xandrsegmentMember') + '" xandrsegmentRedir="' + x.getAttribute('xandrsegmentRedir') + '" xandrsegmentValue="' + x.getAttribute('xandrsegmentValue') + '" xandrsegmentOther="' + x.getAttribute('xandrsegmentOther') + '"></div>';
        });

        for (i = 0; i < uniqIds.length; i += 1) {
            uri = '//ib.adnxs.com/seg?t=2&';
            uri += 'add=' + document.getElementById(uniqIds[i]).getAttribute('xandrsegmentAdd') + '&';
            uri += 'add_code=' + document.getElementById(uniqIds[i]).getAttribute('xandrsegmentAddCode') + '&';
            uri += 'remove=' + document.getElementById(uniqIds[i]).getAttribute('xandrsegmentRemove') + '&';
            uri += 'remove_code=' + document.getElementById(uniqIds[i]).getAttribute('xandrsegmentRemoveCode') + '&';
            uri += 'member=' + document.getElementById(uniqIds[i]).getAttribute('xandrsegmentMember') + '&';
            uri += 'redir=' + document.getElementById(uniqIds[i]).getAttribute('xandrsegmentRedir') + '&';
            uri += 'value=' + document.getElementById(uniqIds[i]).getAttribute('xandrsegmentValue') + '&';
            uri += 'other=' + document.getElementById(uniqIds[i]).getAttribute('xandrsegmentOther');

            document.getElementById(uniqIds[i]).innerHTML = '<img src=\'' + uri + '\' width=\'1\' height=\'1\' />';
        }
    },
    "fallback": function () {
        "use strict";
        var id = 'xandrsegment';
        tarteaucitron.fallback(['xandrsegment-canvas'], tarteaucitron.engage(id));
    }
};

// xandr conversion
// https://docs.xandr.com/bundle/invest_invest-standard/page/topics/working-with-conversion-pixels.html
tarteaucitron.services.xandrconversion = {
    "key": "xandrconversion",
    "type": "ads",
    "name": "Xandr (Conversion)",
    "uri": "https://www.xandr.com/privacy/cookie-policy/",
    "needConsent": true,
    "cookies": ['uuid2', 'uids', 'sess', 'icu', 'anj', 'usersync'],
    "js": function () {
        "use strict";
        var uniqIds = [],
            i,
            uri;

        tarteaucitron.fallback(['xandrconversion-canvas'], function (x) {
            var uniqId = '_' + Math.random().toString(36).substr(2, 9);
            uniqIds.push(uniqId);
            return '<div id="' + uniqId + '" xandrconversionId="' + x.getAttribute('xandrconversionId') + '" xandrconversionSeg="' + x.getAttribute('xandrconversionSeg') + '" xandrconversionOrderId="' + x.getAttribute('xandrconversionOrderId') + '" xandrconversionValue="' + x.getAttribute('xandrconversionValue') + '" xandrconversionRedir="' + x.getAttribute('xandrconversionRedir') + '" xandrconversionOther="' + x.getAttribute('xandrconversionOther') + '"></div>';
        });

        for (i = 0; i < uniqIds.length; i += 1) {
            uri = '//ib.adnxs.com/px?t=2&';
            uri += 'id=' + document.getElementById(uniqIds[i]).getAttribute('xandrconversionId') + '&';
            uri += 'seg=' + document.getElementById(uniqIds[i]).getAttribute('xandrconversionSeg') + '&';
            uri += 'order_id=' + document.getElementById(uniqIds[i]).getAttribute('xandrconversionOrderId') + '&';
            uri += 'value=' + document.getElementById(uniqIds[i]).getAttribute('xandrconversionValue') + '&';
            uri += 'redir=' + document.getElementById(uniqIds[i]).getAttribute('xandrconversionRedir') + '&';
            uri += 'other=' + document.getElementById(uniqIds[i]).getAttribute('xandrconversionOther');

            document.getElementById(uniqIds[i]).innerHTML = '<img src=\'' + uri + '\' width=\'1\' height=\'1\' />';
        }
    },
    "fallback": function () {
        "use strict";
        var id = 'xandrconversion';
        tarteaucitron.fallback(['xandrconversion-canvas'], tarteaucitron.engage(id));
    }
};

// helloasso
tarteaucitron.services.helloasso = {
    "key": "helloasso",
    "type": "api",
    "name": "HelloAsso",
    "uri": "https://www.helloasso.com/confidentialite",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";
        tarteaucitron.fallback(['tac_helloasso'], function (x) {
            var frame_title = tarteaucitron.fixSelfXSS(x.getAttribute("title") || 'HelloAsso iframe'),
                width = x.getAttribute("width"),
                height = x.getAttribute("height"),
                url = x.getAttribute("data-url"),
                allowfullscreen = x.getAttribute("allowfullscreen");

            return '<iframe title="' + frame_title + '" id="haWidget" src="' + url + '" width="' + width + '" height="' + height + '" scrolling="auto" allowtransparency ' + (allowfullscreen == '0' ? '' : ' webkitallowfullscreen mozallowfullscreen allowfullscreen') + '></iframe>';
        });
    },
    "fallback": function () {
        "use strict";
        var id = 'helloasso';
        tarteaucitron.fallback(['tac_helloasso'], function (elem) {
            elem.style.width = elem.getAttribute('width') + 'px';
            elem.style.height = elem.getAttribute('height') + 'px';
            return tarteaucitron.engage(id);
        });
    }
};

// podcloud
tarteaucitron.services.podcloud = {
    "key": "podcloud",
    "type": "video",
    "name": "podCloud",
    "uri": "https://podcloud.fr/privacy",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";
        tarteaucitron.fallback(['tac_podcloud'], function (x) {
            var frame_title = tarteaucitron.fixSelfXSS(x.getAttribute("title") || 'podCloud iframe'),
                width = x.getAttribute("width"),
                height = x.getAttribute("height"),
                url = x.getAttribute("data-url"),
                allowfullscreen = x.getAttribute("allowfullscreen");

            return '<iframe title="' + frame_title + '" src="' + url + '" width="' + width + '" height="' + height + '" scrolling="auto" allowtransparency ' + (allowfullscreen == '0' ? '' : ' webkitallowfullscreen mozallowfullscreen allowfullscreen') + '></iframe>';
        });
    },
    "fallback": function () {
        "use strict";
        var id = 'podcloud';
        tarteaucitron.fallback(['tac_podcloud'], function (elem) {
            elem.style.width = elem.getAttribute('width') + 'px';
            elem.style.height = elem.getAttribute('height') + 'px';
            return tarteaucitron.engage(id);
        });
    }
};

// facebookpost
tarteaucitron.services.facebookpost = {
    "key": "facebookpost",
    "type": "social",
    "name": "Facebook (post)",
    "uri": "https://www.facebook.com/policy.php",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";
        tarteaucitron.fallback(['tac_facebookpost'], function (x) {
            var frame_title = tarteaucitron.fixSelfXSS(x.getAttribute("title") || 'Facebook iframe'),
                width = x.getAttribute("width"),
                height = x.getAttribute("height"),
                url = x.getAttribute("data-url"),
                appId = x.getAttribute("data-appid"),
                allowfullscreen = x.getAttribute("allowfullscreen"),
                showText = x.getAttribute("data-show-text");

            return '<iframe title="' + frame_title + '" src="https://www.facebook.com/plugins/post.php?href=' + encodeURIComponent(url) + '&amp;width=' + width + '&amp;show_text=false&amp;appId=' + appId + '&amp;show_text=' + showText + '&amp;height=' + height + '" width="' + width + '" height="' + height + '" scrolling="auto" allowtransparency ' + (allowfullscreen == '0' ? '' : ' webkitallowfullscreen mozallowfullscreen allowfullscreen') + '></iframe>';
        });
    },
    "fallback": function () {
        "use strict";
        var id = 'facebookpost';
        tarteaucitron.fallback(['tac_facebookpost'], function (elem) {
            elem.style.width = elem.getAttribute('width') + 'px';
            elem.style.height = elem.getAttribute('height') + 'px';
            return tarteaucitron.engage(id);
        });
    }
};

// amplitude
tarteaucitron.services.amplitude = {
    "key": "amplitude",
    "type": "analytic",
    "name": "Amplitude",
    "uri": "https://amplitude.com/privacy",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";
        if (tarteaucitron.user.amplitude === undefined) {
            return;
        }
        tarteaucitron.addScript('https://cdn.amplitude.com/libs/amplitude-5.8.0-min.gz.js', '', function () {

            window.amplitude = {
                _q: [],
                _iq: {}
            };
            function s(e, t) { e.prototype[t] = function () { this._q.push([t].concat(Array.prototype.slice.call(arguments, 0))); return this } }
            var o = function () { this._q = []; return this };
            var a = ["add", "append", "clearAll", "prepend", "set", "setOnce", "unset"];
            for (var u = 0; u < a.length; u++) { s(o, a[u]) }
            amplitude.Identify = o;
            var c = function () { this._q = []; return this };
            var l = ["setProductId", "setQuantity", "setPrice", "setRevenueType", "setEventProperties"];
            for (var p = 0; p < l.length; p++) { s(c, l[p]) }
            amplitude.Revenue = c;
            var d = ["init", "logEvent", "logRevenue", "setUserId", "setUserProperties", "setOptOut", "setVersionName", "setDomain", "setDeviceId", "enableTracking", "setGlobalUserProperties", "identify", "clearUserProperties", "setGroup", "logRevenueV2", "regenerateDeviceId", "groupIdentify", "onInit", "logEventWithTimestamp", "logEventWithGroups", "setSessionId", "resetSessionId"];
            function v(e) { function t(t) { e[t] = function () { e._q.push([t].concat(Array.prototype.slice.call(arguments, 0))) } } for (var n = 0; n < d.length; n++) { t(d[n]) } }
            v(amplitude);
            amplitude.getInstance = function (e) { e = (!e || e.length === 0 ? "$default_instance" : e).toLowerCase(); if (!amplitude._iq.hasOwnProperty(e)) { amplitude._iq[e] = { _q: [] }; v(amplitude._iq[e]) } return amplitude._iq[e] };

            amplitude.getInstance().init(tarteaucitron.user.amplitude);
        });
    }
};

// abtasty
tarteaucitron.services.abtasty = {
    "key": "abtasty",
    "type": "api",
    "name": "ABTasty",
    "uri": "https://www.abtasty.com/terms-of-use/",
    "needConsent": true,
    "cookies": ['ABTasty', 'ABTastySession'],
    "js": function () {
        "use strict";
        if (tarteaucitron.user.abtastyID === undefined) {
            return;
        }
        tarteaucitron.addScript('//try.abtasty.com/' + tarteaucitron.user.abtastyID + '.js');
    }
};


// yandex metrica
tarteaucitron.services.metrica = {
    "key": "metrica",
    "type": "analytic",
    "name": "Yandex Metrica",
    "uri": "https://yandex.com/legal/confidential/",
    "needConsent": true,
    "cookies": ['_ym_metrika_enabled', '_ym_isad', '_ym_uid', '_ym_d', 'yabs-sid', '_ym_debug', '_ym_mp2_substs', '_ym_hostIndex', '_ym_mp2_track', 'yandexuid', 'usst'],
    "js": function () {
        "use strict";
        if (tarteaucitron.user.yandexmetrica === undefined) {
            return;
        }
        tarteaucitron.addScript('https://mc.yandex.ru/metrika/tag.js', '', function () {

            (function (m, e, t, r, i, k, a) {
                m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments) };
                m[i].l = 1 * new Date(); k = e.createElement(t), a = e.getElementsByTagName(t)[0], k.async = 1, k.src = r, a.parentNode.insertBefore(k, a)
            })
                (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

            ym(tarteaucitron.user.yandexmetrica, "init", {
                clickmap: true,
                trackLinks: true,
                accurateTrackBounce: true,
                webvisor: true,
                ecommerce: "dataLayer"
            });
        });
    }
};

// addthis
tarteaucitron.services.addthis = {
    "key": "addthis",
    "type": "social",
    "name": "AddThis",
    "uri": "https://www.addthis.com/privacy/privacy-policy#publisher-visitors",
    "needConsent": true,
    "cookies": ['__atuvc', '__atuvs'],
    "js": function () {
        "use strict";
        if (tarteaucitron.user.addthisPubId === undefined) {
            return;
        }
        if (tarteaucitron.isAjax === true) {
            window.addthis = null;
            window._adr = null;
            window._atc = null;
            window._atd = null;
            window._ate = null;
            window._atr = null;
            window._atw = null;
        }
        tarteaucitron.fallback(['addthis_inline_share_toolbox'], '');
        tarteaucitron.addScript('//s7.addthis.com/js/300/addthis_widget.js#pubid=' + tarteaucitron.user.addthisPubId);
    },
    "fallback": function () {
        "use strict";
        var id = 'addthis';
        tarteaucitron.fallback(['addthis_inline_share_toolbox'], tarteaucitron.engage(id));
    }
};

// addtoanyfeed
tarteaucitron.services.addtoanyfeed = {
    "key": "addtoanyfeed",
    "type": "social",
    "name": "AddToAny (feed)",
    "uri": "https://www.addtoany.com/privacy",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";
        if (tarteaucitron.user.addtoanyfeedUri === undefined) {
            return;
        }
        tarteaucitron.user.addtoanyfeedSubscribeLink = 'https://www.addtoany.com/subscribe?linkurl=' + tarteaucitron.user.addtoanyfeedUri;
        window.a2a_config = window.a2a_config || {};
        window.a2a_config.linkurl = tarteaucitron.user.addtoanyfeedUri;
        tarteaucitron.addScript('//static.addtoany.com/menu/feed.js');
    },
    "fallback": function () {
        "use strict";
        tarteaucitron.user.addtoanyfeedSubscribeLink = 'https://www.addtoany.com/subscribe?linkurl=' + tarteaucitron.user.addtoanyfeedUri;
    }
};

// addtoanyshare
tarteaucitron.services.addtoanyshare = {
    "key": "addtoanyshare",
    "type": "social",
    "name": "AddToAny (share)",
    "uri": "https://www.addtoany.com/privacy",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";
        tarteaucitron.fallback(['tac_addtoanyshare'], function (elem) {
            elem.remove();
        }, true);
        tarteaucitron.addScript('//static.addtoany.com/menu/page.js');
    },
    "fallback": function () {
        "use strict";
        var id = 'addtoanyshare';
        tarteaucitron.fallback(['tac_addtoanyshare'], tarteaucitron.engage(id));
    }
};

// aduptech ads
tarteaucitron.services.aduptech_ads = {
    "key": "aduptech_ads",
    "type": "ads",
    "name": "Ad Up Technology (ads)",
    "uri": "https://www.adup-tech.com/datenschutz",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";

        var IDENTIFIER = "aduptech_ads",
            API_URL = "https://s.d.adup-tech.com/jsapi";

        var elements = document.getElementsByClassName(IDENTIFIER);
        if (!elements || elements.length === 0) {
            return;
        }

        tarteaucitron.fallback([IDENTIFIER], "");

        tarteaucitron.addScript(API_URL, "", function () {
            for (var i = 0; i < elements.length; i++) {
                var element = elements[i];

                if (!element.getAttribute("id")) {
                    element.setAttribute("id", IDENTIFIER + Math.random().toString(36).substr(2, 9));
                }

                window.uAd.embed(element.getAttribute("id"), {
                    placementKey: element.getAttribute("placementKey"),
                    responsive: Boolean(element.getAttribute("responsive")),
                    lazy: Boolean(element.getAttribute("lazy")),
                    adtest: Boolean(element.getAttribute("test")),
                    query: element.getAttribute("query") || "",
                    minCpc: element.getAttribute("minCpc") || "",
                    pageUrl: element.getAttribute("pageUrl") || "",
                    skip: element.getAttribute("skip") || ""
                });
            }
        });

    },
    "fallback": function () {
        "use strict";
        tarteaucitron.fallback(["aduptech_ads"], tarteaucitron.engage("aduptech_ads"));
    }
};

// aduptech conversion
tarteaucitron.services.aduptech_conversion = {
    "key": "aduptech_conversion",
    "type": "ads",
    "name": "Ad Up Technology (conversion)",
    "uri": "https://www.adup-tech.com/datenschutz",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";

        var IDENTIFIER = "aduptech_conversion",
            CONVERSION_PIXEL_BASE_URL = "https://d.adup-tech.com/campaign/conversion";

        var elements = document.getElementsByClassName(IDENTIFIER);
        if (!elements || elements.length === 0) {
            return;
        }

        tarteaucitron.fallback([IDENTIFIER], "");

        for (var i = 0; i < elements.length; i++) {
            var element = elements[i];

            if (!element.getAttribute("advertiserId") || !element.getAttribute("conversionCode")) {
                continue;
            }

            var url = CONVERSION_PIXEL_BASE_URL +
                "/" + encodeURIComponent(element.getAttribute("advertiserId")) +
                "?t=" + encodeURIComponent(element.getAttribute("conversionCode"));

            if (element.getAttribute("price")) {
                url += "&price=" + encodeURIComponent(element.getAttribute("price"));
            }

            if (element.getAttribute("quantity")) {
                url += "&quantity=" + encodeURIComponent(element.getAttribute("quantity"));
            }

            if (element.getAttribute("total")) {
                url += "&total=" + encodeURIComponent(element.getAttribute("total"));
            }

            if (element.getAttribute("orderId")) {
                url += "&order_id=" + encodeURIComponent(element.getAttribute("orderId"));
            }

            if (element.getAttribute("itemNumber")) {
                url += "&item_number=" + encodeURIComponent(element.getAttribute("itemNumber"));
            }

            if (element.getAttribute("description")) {
                url += "&description=" + encodeURIComponent(element.getAttribute("description"));
            }

            (new Image()).src = url;
        }
    }
};

// aduptech retargeting
tarteaucitron.services.aduptech_retargeting = {
    "key": "aduptech_retargeting",
    "type": "ads",
    "name": "Ad Up Technology (retargeting)",
    "uri": "https://www.adup-tech.com/datenschutz",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";

        var IDENTIFIER = "aduptech_retargeting",
            API_URL = "https://s.d.adup-tech.com/services/retargeting.js";

        var elements = document.getElementsByClassName(IDENTIFIER);
        if (!elements || elements.length === 0) {
            return;
        }

        tarteaucitron.fallback([IDENTIFIER], "");

        window.AdUpRetargeting = function (api) {
            for (var i = 0; i < elements.length; i++) {
                var element = elements[i];

                api.init();

                api.setAccount(element.getAttribute("account"));

                if (element.getAttribute("email")) {
                    api.setEmail(element.getAttribute("email"));
                } else if (element.getAttribute("hashedEmail")) {
                    api.setHashedEmail(element.getAttribute("hashedEmail"));
                }

                if (element.getAttribute("product")) {
                    try {
                        api.setProduct(JSON.parse(element.getAttribute("product")));
                    } catch (e) {
                        api.setProduct(element.getAttribute("product"));
                    }
                }

                if (element.getAttribute("transaction")) {
                    try {
                        api.setTransaction(JSON.parse(element.getAttribute("transaction")));
                    } catch (e) {
                        api.setTransaction(element.getAttribute("transaction"));
                    }
                }

                if (element.getAttribute("demarkUser")) {
                    api.setDemarkUser();
                } else if (element.getAttribute("demarkProducts")) {
                    api.setDemarkProducts();
                }

                if (element.getAttribute("conversionCode")) {
                    api.setConversionCode(element.getAttribute("conversionCode"));
                }

                if (element.getAttribute("device")) {
                    var setter = "set" + element.getAttribute("device").charAt(0).toUpperCase() + element.getAttribute("device").slice(1);
                    if (typeof api[setter] === 'function') {
                        api[setter]();
                    }
                }

                if (element.getAttribute("track")) {
                    var tracker = "track" + element.getAttribute("track").charAt(0).toUpperCase() + element.getAttribute("track").slice(1);
                    if (typeof api[tracker] === "function") {
                        api[tracker]();
                    } else {
                        api.trackHomepage();
                    }
                }
            };
        };

        tarteaucitron.addScript(API_URL);
    }
};

// alexa
tarteaucitron.services.alexa = {
    "key": "alexa",
    "type": "analytic",
    "name": "Alexa",
    "uri": "https://www.alexa.com/help/privacy",
    "needConsent": true,
    "cookies": ['__asc', '__auc'],
    "js": function () {
        "use strict";
        if (tarteaucitron.user.alexaAccountID === undefined) {
            return;
        }
        window._atrk_opts = {
            atrk_acct: tarteaucitron.user.alexaAccountID,
            domain: window.location.hostname.match(/[^\.]*\.[^.]*$/)[0],
            dynamic: true
        };
        tarteaucitron.addScript('https://d31qbv1cthcecs.cloudfront.net/atrk.js');
    }
};

// amazon
tarteaucitron.services.amazon = {
    "key": "amazon",
    "type": "ads",
    "name": "Amazon",
    "uri": "https://www.amazon.com/gp/help/customer/display.html/ref=help_search_1-1?ie=UTF8&nodeId=201909010&qid=1544617177&sr=1-1",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";
        tarteaucitron.fallback(['amazon_product'], function (x) {
            var frame_title = tarteaucitron.fixSelfXSS(x.getAttribute("title") || 'Amazon iframe'),
                amazonId = x.getAttribute("amazonid"),
                productId = x.getAttribute("productid"),
                url = '//ws-eu.amazon-adsystem.com/widgets/q?ServiceVersion=20070822&OneJS=1&Operation=GetAdHtml&MarketPlace=' + tarteaucitron.getLanguage().toUpperCase() + '&source=ss&ref=ss_til&ad_type=product_link&tracking_id=' + amazonId + '&marketplace=amazon&region=' + tarteaucitron.getLanguage().toUpperCase() + '&placement=' + productId + '&asins=' + productId + '&show_border=true&link_opens_in_new_window=true',
                iframe = '<iframe title="' + frame_title + '" style="width:120px;height:240px;" marginwidth="0" marginheight="0" scrolling="no" src="' + url + '"></iframe>';

            return iframe;
        });
    },
    "fallback": function () {
        "use strict";
        var id = 'amazon';
        tarteaucitron.fallback(['amazon_product'], tarteaucitron.engage(id));
    }
};

// calameo
tarteaucitron.services.calameo = {
    "key": "calameo",
    "type": "video",
    "name": "Calameo",
    "uri": "https://fr.calameo.com/privacy",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";
        tarteaucitron.fallback(['calameo-canvas'], function (x) {
            var frame_title = tarteaucitron.fixSelfXSS(x.getAttribute("title") || 'Calameo iframe'),
                id = x.getAttribute("data-id"),
                width = x.getAttribute("width"),
                height = x.getAttribute("height"),
                url = '//v.calameo.com/?bkcode=' + id,
                allowfullscreen = x.getAttribute("allowfullscreen");

            return '<iframe title="' + frame_title + '" src="' + url + '" width="' + width + '" height="' + height + '" scrolling="no" allowtransparency ' + (allowfullscreen == '0' ? '' : ' webkitallowfullscreen mozallowfullscreen allowfullscreen') + '></iframe>';
        });
    },
    "fallback": function () {
        "use strict";
        var id = 'calameo';
        tarteaucitron.fallback(['calameo-canvas'], function (elem) {
            elem.style.width = elem.getAttribute('width') + 'px';
            elem.style.height = elem.getAttribute('height') + 'px';
            return tarteaucitron.engage(id);
        });
    }
};

// clicky
tarteaucitron.services.clicky = {
    "key": "clicky",
    "type": "analytic",
    "name": "Clicky",
    "uri": "https://clicky.com/terms",
    "needConsent": true,
    "cookies": ['_jsuid', '_eventqueue', '_referrer_og', '_utm_og', '_first_pageview', 'clicky_olark', 'no_trackyy_' + tarteaucitron.user.clickyId, 'unpoco_' + tarteaucitron.user.clickyId, 'heatmaps_g2g_' + tarteaucitron.user.clickyId],
    "js": function () {
        "use strict";
        if (tarteaucitron.user.clickyId === undefined) {
            return;
        }
        tarteaucitron.addScript('//static.getclicky.com/js', '', function () {
            if (typeof clicky.init === 'function') {
                clicky.init(tarteaucitron.user.clickyId);
            }
            if (typeof tarteaucitron.user.clickyMore === 'function') {
                tarteaucitron.user.clickyMore();
            }
        });
    }
};

// clicmanager
tarteaucitron.services.clicmanager = {
    "key": "clicmanager",
    "type": "ads",
    "name": "Clicmanager",
    "uri": "http://www.clicmanager.fr/infos_legales.php",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";
        var uniqIds = [],
            i,
            uri;

        tarteaucitron.fallback(['clicmanager-canvas'], function (x) {
            var uniqId = '_' + Math.random().toString(36).substr(2, 9);
            uniqIds.push(uniqId);
            return '<div id="' + uniqId + '" c="' + x.getAttribute('c') + '" s="' + x.getAttribute('s') + '" t="' + x.getAttribute('t') + '"></div>';
        });

        for (i = 0; i < uniqIds.length; i += 1) {
            uri = '//ads.clicmanager.fr/exe.php?';
            uri += 'c=' + document.getElementById(uniqIds[i]).getAttribute('c') + '&';
            uri += 's=' + document.getElementById(uniqIds[i]).getAttribute('s') + '&';
            uri += 't=' + document.getElementById(uniqIds[i]).getAttribute('t');

            tarteaucitron.makeAsync.init(uri, uniqIds[i]);
        }
    },
    "fallback": function () {
        "use strict";
        var id = 'clicmanager';
        tarteaucitron.fallback(['clicmanager-canvas'], tarteaucitron.engage(id));
    }
};

// compteur
tarteaucitron.services.compteur = {
    "key": "compteur",
    "type": "analytic",
    "name": "Compteur.fr",
    "uri": "https://www.compteur.fr/help_privacy_policy.htm",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";
        if (tarteaucitron.user.compteurID === undefined) {
            return;
        }
        tarteaucitron.addScript('https://server2.compteur.fr/log7.js', '', function () { wtslog7(tarteaucitron.user.compteurID, 1); });
    }
};

// contentsquare
tarteaucitron.services.contentsquare = {
    "key": "contentsquare",
    "type": "api",
    "name": "ContentSquare",
    "uri": "https://docs.contentsquare.com/uxa-en/#collected-data",
    "needConsent": true,
    "cookies": ['_cs_id', '_cs_s', '_cs_vars', '_cs_ex', '_cs_c', '_cs_optout'],
    "js": function () {
        "use strict";
        if (tarteaucitron.user.contentsquareID === undefined) {
            return;
        }
        tarteaucitron.addScript('//t.contentsquare.net/uxa/' + tarteaucitron.user.contentsquareID + '.js');
    }
};

// crazyegg
tarteaucitron.services.crazyegg = {
    "key": "crazyegg",
    "type": "analytic",
    "name": "Crazy Egg",
    "uri": "https://www.crazyegg.com/privacy",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";

        if (tarteaucitron.user.crazyeggId === undefined) {
            return;
        }

        tarteaucitron.addScript('//script.crazyegg.com/pages/scripts/' + tarteaucitron.user.crazyeggId.substr(0, 4) + '/' + tarteaucitron.user.crazyeggId.substr(4, 4) + '.js');
    }
};

// clarity
tarteaucitron.services.clarity = {
    "key": "clarity",
    "type": "analytic",
    "name": "Clarity",
    "uri": "https://clarity.microsoft.com/",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";

        window["clarity"] = window["clarity"] || function () { (window["clarity"].q = window["clarity"].q || []).push(arguments) };

        tarteaucitron.addScript('https://www.clarity.ms/tag/' + tarteaucitron.user.clarity);
    }
};

// criteo
tarteaucitron.services.criteo = {
    "key": "criteo",
    "type": "ads",
    "name": "Criteo",
    "uri": "http://www.criteo.com/privacy/",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";
        document.MAX_ct0 = '';
        var uniqIds = [],
            i,
            uri;

        tarteaucitron.fallback(['criteo-canvas'], function (x) {
            var uniqId = '_' + Math.random().toString(36).substr(2, 9);
            uniqIds.push(uniqId);
            return '<div id="' + uniqId + '" zoneid="' + x.getAttribute('zoneid') + '"></div>';
        });

        for (i = 0; i < uniqIds.length; i += 1) {
            uri = '//cas.criteo.com/delivery/ajs.php?';
            uri += 'zoneid=' + document.getElementById(uniqIds[i]).getAttribute('zoneid');
            uri += '&nodis=1&cb=' + Math.floor(Math.random() * 99999999999);
            uri += '&loc=' + encodeURI(window.location);
            uri += (document.MAX_used !== ',') ? '&exclude=' + document.MAX_used : '';
            uri += (document.charset !== undefined ? '&charset=' + document.charset : '');
            uri += (document.characterSet !== undefined ? '&charset=' + document.characterSet : '');
            uri += (document.referrer !== undefined) ? '&referer=' + encodeURI(document.referrer) : '';
            uri += (document.context !== undefined) ? '&context=' + encodeURI(document.context) : '';
            uri += ((document.MAX_ct0 !== undefined) && (document.MAX_ct0.substring(0, 4) === 'http')) ? '&ct0=' + encodeURI(document.MAX_ct0) : '';
            uri += (document.mmm_fo !== undefined) ? '&mmm_fo=1' : '';

            tarteaucitron.makeAsync.init(uri, uniqIds[i]);
        }
    },
    "fallback": function () {
        "use strict";
        var id = 'criteo';
        tarteaucitron.fallback(['criteo-canvas'], tarteaucitron.engage(id));
    }
};

// criteo onetag
tarteaucitron.services.criteoonetag = {
    "key": "criteoonetag",
    "type": "ads",
    "name": "Criteo OneTag",
    "uri": "https://www.criteo.com/privacy/",
    "needConsent": true,
    "cookies": ['uid', 'tk', 'uid3pd'],
    "js": function() {
        "use strict";
        if (tarteaucitron.user.criteoonetagAccount === undefined) return;

        window.criteo_q = window.criteo_q || []; 
        window.criteo_q.push({
            event: "setAccount",
            account: tarteaucitron.user.criteoonetagAccount
        })

        tarteaucitron.addScript('//static.criteo.net/js/ld/ld.js', '', function() {
            if (typeof tarteaucitron.user.criteoonetagMore === 'function') {
                tarteaucitron.user.criteoonetagMore();
            }
        });
    }
};

// artetv
tarteaucitron.services.artetv = {
    "key": "artetv",
    "type": "video",
    "name": "Arte.tv",
    "uri": "https://www.arte.tv/sites/fr/corporate/donnees-personnelles/",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";
        tarteaucitron.fallback(['artetv_player'], function (x) {
            var frame_title = tarteaucitron.fixSelfXSS(x.getAttribute("title") || 'Arte.tv iframe'),
                video_json = x.getAttribute("json"),
                video_width = x.getAttribute("width"),
                video_height = x.getAttribute("height"),
                video_frame,
                video_allowfullscreen = x.getAttribute("allowfullscreen");

            if (video_json === undefined) {
                return "";
            }

            video_frame = '<iframe title="' + frame_title + '" style="transition-duration: 0; transition-property: no; margin: 0 auto; position: relative; display: block; background-color: #000000;" src="https://www.arte.tv/player/v5/index.php?json_url=' + video_json + '" width="' + video_width + '" height="' + video_height + '" scrolling="no" ' + (video_allowfullscreen == '0' ? '' : ' webkitallowfullscreen mozallowfullscreen allowfullscreen') + '></iframe>';
            return video_frame;
        });
    },
    "fallback": function () {
        "use strict";
        var id = 'artetv';
        tarteaucitron.fallback(['artetv_player'], function (elem) {
            elem.style.width = elem.getAttribute('width') + 'px';
            elem.style.height = elem.getAttribute('height') + 'px';
            return tarteaucitron.engage(id);
        });
    }
};

// dailymotion
tarteaucitron.services.dailymotion = {
    "key": "dailymotion",
    "type": "video",
    "name": "Dailymotion",
    "uri": "https://www.dailymotion.com/legal/privacy",
    "needConsent": true,
    "cookies": ['ts', 'dmvk', 'hist', 'v1st', 's_vi'],
    "js": function () {
        "use strict";
        tarteaucitron.fallback(['dailymotion_player'], function (x) {
            var frame_title = tarteaucitron.fixSelfXSS(tarteaucitron.getElemAttr(x, "title") || 'Dailymotion iframe'),
                video_id = tarteaucitron.getElemAttr(x, "videoID"),
                video_width = tarteaucitron.getElemAttr(x, "width"),
                frame_width = 'width=',
                video_height = tarteaucitron.getElemAttr(x, "height"),
                frame_height = 'height=',
                video_frame,
                embed_type = tarteaucitron.getElemAttr(x, "embedType"),
                allowfullscreen = tarteaucitron.getElemAttr(x, "allowfullscreen"),
                showinfo = tarteaucitron.getElemAttr(x, "showinfo"),
                autoplay = tarteaucitron.getElemAttr(x, "autoplay"),
                api = tarteaucitron.getElemAttr(x, "api"),
                params = 'info=' + showinfo + '&autoPlay=' + autoplay + '&api=' + api;

            if (video_id === undefined) {
                return "";
            }
            if (video_width !== undefined) {
                frame_width += '"' + video_width + '" ';
            } else {
                frame_width += '"" ';
            }
            if (video_height !== undefined) {
                frame_height += '"' + video_height + '" ';
            } else {
                frame_height += '"" ';
            }
            if (embed_type === undefined || !['video', 'playlist'].includes(embed_type)) {
                embed_type = "video";
            }
            video_frame = '<iframe title="' + frame_title + '" src="//www.dailymotion.com/embed/' + embed_type + '/' + video_id + '?' + params + '" ' + frame_width + frame_height + (allowfullscreen == '0' ? '' : ' webkitallowfullscreen mozallowfullscreen allowfullscreen') + '></iframe>';
            return video_frame;
        });
    },
    "fallback": function () {
        "use strict";
        var id = 'dailymotion';
        tarteaucitron.fallback(['dailymotion_player'], function (elem) {
            elem.style.width = elem.getAttribute('width') + 'px';
            elem.style.height = elem.getAttribute('height') + 'px';
            return tarteaucitron.engage(id);
        });
    }
};

// dating affiliation
tarteaucitron.services.datingaffiliation = {
    "key": "datingaffiliation",
    "type": "ads",
    "name": "Dating Affiliation",
    "uri": "http://www.dating-affiliation.com/conditions-generales.php",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";
        tarteaucitron.fallback(['datingaffiliation-canvas'], function (x) {
            var frame_title = tarteaucitron.fixSelfXSS(x.getAttribute("title") || 'Dating Affiliation iframe'),
                comfrom = x.getAttribute("data-comfrom"),
                r = x.getAttribute("data-r"),
                p = x.getAttribute("data-p"),
                cf0 = x.getAttribute("data-cf0"),
                langue = x.getAttribute("data-langue"),
                forward_affiliate = x.getAttribute("data-forwardAffiliate"),
                cf2 = x.getAttribute("data-cf2"),
                cfsa2 = x.getAttribute("data-cfsa2"),
                width = x.getAttribute("width"),
                height = x.getAttribute("height"),
                url = 'http://www.tools-affil2.com/rotaban/ban.php?' + comfrom;

            return '<iframe title="' + frame_title + '" src="' + url + '&r=' + r + '&p=' + p + '&cf0=' + cf0 + '&langue=' + langue + '&forward_affiliate=' + forward_affiliate + '&cf2=' + cf2 + '&cfsa2=' + cfsa2 + '" width="' + width + '" height="' + height + '" marginheight="0" marginwidth="0" scrolling="no"></iframe>';
        });
    },
    "fallback": function () {
        "use strict";
        var id = 'datingaffiliation';
        tarteaucitron.fallback(['datingaffiliation-canvas'], function (elem) {
            elem.style.width = elem.getAttribute('width') + 'px';
            elem.style.height = elem.getAttribute('height') + 'px';
            return tarteaucitron.engage(id);
        });
    }
};

// dating affiliation popup
tarteaucitron.services.datingaffiliationpopup = {
    "key": "datingaffiliationpopup",
    "type": "ads",
    "name": "Dating Affiliation (Pop Up)",
    "uri": "http://www.dating-affiliation.com/conditions-generales.php",
    "needConsent": true,
    "cookies": ['__utma', '__utmb', '__utmc', '__utmt_Tools', '__utmv', '__utmz', '_ga', '_gat', '_gat_UA-65072040-17', '__da-pu-xflirt-ID-pc-o169'],
    "js": function () {
        "use strict";
        var uniqIds = [],
            i,
            uri;

        tarteaucitron.fallback(['datingaffiliationpopup-canvas'], function (x) {
            var uniqId = '_' + Math.random().toString(36).substr(2, 9);
            uniqIds.push(uniqId);
            return '<div id="' + uniqId + '" uri="' + x.getAttribute('uri') + '" comfrom="' + x.getAttribute('comfrom') + '" promo="' + x.getAttribute('promo') + '" productid="' + x.getAttribute('productid') + '" submitconfig="' + x.getAttribute('submitconfig') + '" ur="' + x.getAttribute('ur') + '" brand="' + x.getAttribute('brand') + '" lang="' + x.getAttribute('lang') + '" cf0="' + x.getAttribute('cf0') + '" cf2="' + x.getAttribute('cf2') + '" subid1="' + x.getAttribute('subid1') + '" cfsa2="' + x.getAttribute('cfsa2') + '" subid2="' + x.getAttribute('subid2') + '" nicheid="' + x.getAttribute('nicheid') + '" degreid="' + x.getAttribute('degreid') + '" bt="' + x.getAttribute('bt') + '" vis="' + x.getAttribute('vis') + '" hid="' + x.getAttribute('hid') + '" snd="' + x.getAttribute('snd') + '" aabd="' + x.getAttribute('aabd') + '" aabs="' + x.getAttribute('aabs') + '"></div>';
        });

        for (i = 0; i < uniqIds.length; i += 1) {
            uri = 'http://www.promotools.biz/da/popunder/script.php?';
            uri += 'comfrom=' + document.getElementById(uniqIds[i]).getAttribute('comfrom') + '&';
            uri += 'promo=' + document.getElementById(uniqIds[i]).getAttribute('promo') + '&';
            uri += 'product_id=' + document.getElementById(uniqIds[i]).getAttribute('productid') + '&';
            uri += 'submitconfig=' + document.getElementById(uniqIds[i]).getAttribute('submitconfig') + '&';
            uri += 'ur=' + document.getElementById(uniqIds[i]).getAttribute('ur') + '&';
            uri += 'brand=' + document.getElementById(uniqIds[i]).getAttribute('brand') + '&';
            uri += 'lang=' + document.getElementById(uniqIds[i]).getAttribute('lang') + '&';
            uri += 'cf0=' + document.getElementById(uniqIds[i]).getAttribute('cf0') + '&';
            uri += 'cf2=' + document.getElementById(uniqIds[i]).getAttribute('cf2') + '&';
            uri += 'subid1=' + document.getElementById(uniqIds[i]).getAttribute('subid1') + '&';
            uri += 'cfsa2=' + document.getElementById(uniqIds[i]).getAttribute('cfsa2') + '&';
            uri += 'subid2=' + document.getElementById(uniqIds[i]).getAttribute('subid2') + '&';
            uri += 'nicheId=' + document.getElementById(uniqIds[i]).getAttribute('nicheid') + '&';
            uri += 'degreId=' + document.getElementById(uniqIds[i]).getAttribute('degreid') + '&';
            uri += 'bt=' + document.getElementById(uniqIds[i]).getAttribute('bt') + '&';
            uri += 'vis=' + document.getElementById(uniqIds[i]).getAttribute('vis') + '&';
            uri += 'hid=' + document.getElementById(uniqIds[i]).getAttribute('hid') + '&';
            uri += 'snd=' + document.getElementById(uniqIds[i]).getAttribute('snd') + '&';
            uri += 'aabd=' + document.getElementById(uniqIds[i]).getAttribute('aabd') + '&';
            uri += 'aabs=' + document.getElementById(uniqIds[i]).getAttribute('aabs');

            tarteaucitron.makeAsync.init(uri, uniqIds[i]);
        }
    },
    "fallback": function () {
        "use strict";
        var id = 'datingaffiliationpopup';
        tarteaucitron.fallback(['datingaffiliationpopup-canvas'], tarteaucitron.engage(id));
    }
};

// deezer
tarteaucitron.services.deezer = {
    "key": "deezer",
    "type": "video",
    "name": "Deezer",
    "uri": "https://www.deezer.com/legal/personal-datas",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";
        tarteaucitron.fallback(['deezer_player'], function (x) {
            var frame_title = tarteaucitron.fixSelfXSS(x.getAttribute("title") || 'Deezer iframe'),
                deezer_id = x.getAttribute("deezerID"),
                deezer_width = x.getAttribute("width"),
                frame_width = 'width=',
                deezer_height = x.getAttribute("height"),
                frame_height = 'height=',
                deezer_frame,
                embed_theme = x.getAttribute("theme"),
                embed_type = x.getAttribute("embedType"),
                radius = x.getAttribute("radius"),
                tracklist = x.getAttribute("tracklist"),
                allowfullscreen = x.getAttribute("allowfullscreen"),
                params;

            if (deezer_id === undefined) {
                return "";
            }
            if (deezer_width !== undefined) {
                frame_width += '"' + deezer_width + '" ';
            } else {
                frame_width += '"" ';
            }
            if (deezer_height !== undefined) {
                frame_height += '"' + deezer_height + '" ';
            } else {
                frame_height += '"" ';
            }
            if (embed_theme === undefined || !['auto', 'light', 'dark'].includes(embed_theme)) {
                embed_theme = "auto";
            }
            if (embed_type === undefined || !['album', 'track', 'playlist'].includes(embed_type)) {
                embed_type = "album";
            }
            if (radius === undefined || !['true', 'false'].includes(radius)) {
                radius = "true";
            }
            if (tracklist === undefined || !['true', 'false'].includes(tracklist)) {
                tracklist = "true";
            }
            params = 'tracklist=' + tracklist + '&radius=' + radius;
            deezer_frame = '<iframe title="' + frame_title + '" src="//widget.deezer.com/widget/' + embed_theme + '/' + embed_type + '/' + deezer_id + '?' + params + '" ' + frame_width + frame_height + ' ' + (allowfullscreen == '0' ? '' : ' webkitallowfullscreen mozallowfullscreen allowfullscreen') + '></iframe>';
            return deezer_frame;
        });
    },
    "fallback": function () {
        "use strict";
        var id = 'deezer';
        tarteaucitron.fallback(['deezer_player'], function (elem) {
            elem.style.width = elem.getAttribute('width') + 'px';
            elem.style.height = elem.getAttribute('height') + 'px';
            return tarteaucitron.engage(id);
        });
    }
};

// leadforensics
tarteaucitron.services.leadforensics = {
    "key": "leadforensics",
    "type": "analytic",
    "name": "LeadForensics",
    "uri": "https://www.leadforensics.com/privacy-policy/",
    "needConsent": true,
    "cookies": ['trackalyzer'],
    "js": function () {
        "use strict";
        if (tarteaucitron.user.leadforensicsSf14gv === undefined ||
            tarteaucitron.user.leadforensicsIidentifier === undefined) {
            return;
        }

        window.sf14gv = tarteaucitron.user.leadforensicsSf14gv;

        (function () {
            var sf14g = document.createElement('script'); sf14g.async = true;
            sf14g.src = ('https:' == document.location.protocol ? 'https://' : 'http://') + 't.sf14g.com/sf14g.js';
            var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(sf14g, s);
        })();

        tarteaucitron.addScript('//secure.leadforensics.com/js/' + tarteaucitron.user.leadforensicsIidentifier + '.js');
    }
};

// disqus
tarteaucitron.services.disqus = {
    "key": "disqus",
    "type": "comment",
    "name": "Disqus",
    "uri": "https://help.disqus.com/customer/portal/articles/466259-privacy-policy",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";
        if (tarteaucitron.user.disqusShortname === undefined) {
            return;
        }
        tarteaucitron.addScript('//' + tarteaucitron.user.disqusShortname + '.disqus.com/embed.js');
        tarteaucitron.addScript('//' + tarteaucitron.user.disqusShortname + '.disqus.com/count.js');
    },
    "fallback": function () {
        "use strict";
        var id = 'disqus';

        if (document.getElementById('disqus_thread')) {
            document.getElementById('disqus_thread').innerHTML = tarteaucitron.engage(id);
        }
    }
};

// ekomi
tarteaucitron.services.ekomi = {
    "key": "ekomi",
    "type": "social",
    "name": "eKomi",
    "uri": "http://www.ekomi-us.com/us/privacy/",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";
        if (tarteaucitron.user.ekomiCertId === undefined) {
            return;
        }
        window.eKomiIntegrationConfig = [
            { certId: tarteaucitron.user.ekomiCertId }
        ];
        tarteaucitron.addScript('//connect.ekomi.de/integration_1410173009/' + tarteaucitron.user.ekomiCertId + '.js');
    }
};

// etracker
tarteaucitron.services.etracker = {
    "key": "etracker",
    "type": "analytic",
    "name": "eTracker",
    "uri": "https://www.etracker.com/en/data-protection.html",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";
        if (tarteaucitron.user.etracker === undefined) {
            return;
        }

        tarteaucitron.addScript('//static.etracker.com/code/e.js', '_etLoader', function () { }, true, "data-secure-code", tarteaucitron.user.etracker);
    }
};

// facebook
tarteaucitron.services.facebook = {
    "key": "facebook",
    "type": "social",
    "name": "Facebook",
    "uri": "https://www.facebook.com/policy.php",
    "needConsent": true,
    "cookies": ['xs', 'sb', 'fr', 'datr', 'dpr', 'c_user'],
    "js": function () {
        "use strict";
        tarteaucitron.fallback(['fb-post', 'fb-follow', 'fb-activity', 'fb-send', 'fb-share-button', 'fb-like', 'fb-video'], '');
        tarteaucitron.addScript('//connect.facebook.net/' + tarteaucitron.getLocale() + '/sdk.js#xfbml=1&version=v2.0', 'facebook-jssdk');
        if (tarteaucitron.isAjax === true) {
            if (typeof FB !== "undefined") {
                FB.XFBML.parse();
            }
        }
    },
    "fallback": function () {
        "use strict";
        var id = 'facebook';
        tarteaucitron.fallback(['fb-post', 'fb-follow', 'fb-activity', 'fb-send', 'fb-share-button', 'fb-like', 'fb-video'], tarteaucitron.engage(id));
    }
};

// facebooklikebox
tarteaucitron.services.facebooklikebox = {
    "key": "facebooklikebox",
    "type": "social",
    "name": "Facebook (like box)",
    "uri": "https://www.facebook.com/policy.php",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";
        tarteaucitron.fallback(['fb-like-box', 'fb-page'], '');
        tarteaucitron.addScript('//connect.facebook.net/' + tarteaucitron.getLocale() + '/sdk.js#xfbml=1&version=v2.3', 'facebook-jssdk');
        if (tarteaucitron.isAjax === true) {
            if (typeof FB !== "undefined") {
                FB.XFBML.parse();
            }
        }
    },
    "fallback": function () {
        "use strict";
        var id = 'facebooklikebox';
        tarteaucitron.fallback(['fb-like-box', 'fb-page'], tarteaucitron.engage(id));
    }
};

// facebookcomment
tarteaucitron.services.facebookcomment = {
    "key": "facebookcomment",
    "type": "comment",
    "name": "Facebook (commentaire)",
    "uri": "https://www.facebook.com/policy.php",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";
        tarteaucitron.fallback(['fb-comments'], '');
        tarteaucitron.addScript('//connect.facebook.net/' + tarteaucitron.getLocale() + '/sdk.js#xfbml=1&version=v2.0', 'facebook-jssdk');
        if (tarteaucitron.isAjax === true) {
            if (typeof FB !== "undefined") {
                FB.XFBML.parse();
            }
        }
    },
    "fallback": function () {
        "use strict";
        var id = 'facebookcomment';
        tarteaucitron.fallback(['fb-comments'], tarteaucitron.engage(id));
    }
};

// ferank
tarteaucitron.services.ferank = {
    "key": "ferank",
    "type": "analytic",
    "name": "FERank",
    "uri": "https://www.ferank.fr/respect-vie-privee/#mesureaudience",
    "needConsent": false,
    "cookies": [],
    "js": function () {
        "use strict";
        tarteaucitron.addScript('//static.ferank.fr/pixel.js', '', function () {
            if (typeof tarteaucitron.user.ferankMore === 'function') {
                tarteaucitron.user.ferankMore();
            }
        });
    }
};

// pingdom
tarteaucitron.services.pingdom = {
    "key": "pingdom",
    "type": "api",
    "name": "Pingdom",
    "uri": "https://www.solarwinds.com/general-data-protection-regulation-cloud",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";

        if (tarteaucitron.user.pingdomId === undefined) {
            return;
        }

        window._prum = [['id', tarteaucitron.user.pingdomId], ['mark', 'firstbyte', (new Date()).getTime()]];

        tarteaucitron.addScript('https://rum-static.pingdom.net/prum.min.js');
    }
};


// simpleanalytics
tarteaucitron.services.simpleanalytics = {
    "key": "simpleanalytics",
    "type": "analytic",
    "name": "Simple Analytics",
    "uri": "https://docs.simpleanalytics.com/what-we-collect",
    "needConsent": false,
    "cookies": [],
    "js": function () {
        "use strict";
        tarteaucitron.addScript('https://scripts.simpleanalyticscdn.com/latest.js');
    }
};

// stonly
tarteaucitron.services.stonly = {
    "key": "stonly",
    "type": "api",
    "name": "Stonly",
    "uri": "https://stonly.com/privacy",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";
        if (tarteaucitron.user.stonlyId === undefined) {
            return;
        }

        window.STONLY_WID = tarteaucitron.user.stonlyId;
        window.StonlyWidget || ((window.w = window.StonlyWidget = function () {
            window.w._api ? window.w._api.apply(window.w, arguments) : window.w.queue.push(arguments)
        }).queue = []);

        tarteaucitron.addScript('https://stonly.com/js/widget/v2/stonly-widget.js?v=' + Date.now());
    }
};

// stripe
/*tarteaucitron.services.stripe = {
    "key": "stripe",
    "type": "api",
    "name": "Stripe",
    "uri": "https://stripe.com/cookies-policy/legal",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";
        tarteaucitron.addScript('https://js.stripe.com/v3/');
    }
};*/

// ferank pub
tarteaucitron.services.ferankpub = {
    "key": "ferankpub",
    "type": "ads",
    "name": "FERank (pub)",
    "uri": "https://www.ferank.fr/respect-vie-privee/#regiepublicitaire",
    "needConsent": false,
    "cookies": [],
    "js": function () {
        "use strict";
        tarteaucitron.addScript('//static.ferank.fr/publicite.async.js');
        if (tarteaucitron.isAjax === true) {
            if (typeof ferankReady === 'function') {
                ferankReady();
            }
        }
    },
    "fallback": function () {
        "use strict";
        var id = 'ferankpub';
        tarteaucitron.fallback(['ferank-publicite'], tarteaucitron.engage(id));
    }
};

// get+
tarteaucitron.services.getplus = {
    "key": "getplus",
    "type": "analytic",
    "name": "Get+",
    "uri": "http://www.getplus.fr/Conditions-generales-de-vente_a226.html",
    "needConsent": true,
    "cookies": ['_first_pageview', '_jsuid', 'no_trackyy_' + tarteaucitron.user.getplusId, '_eventqueue'],
    "js": function () {
        "use strict";
        if (tarteaucitron.user.getplusId === undefined) {
            return;
        }

        window.webleads_site_ids = window.webleads_site_ids || [];
        window.webleads_site_ids.push(tarteaucitron.user.getplusId);
        tarteaucitron.addScript('//stats.webleads-tracker.com/js');
    }
};

// google+
tarteaucitron.services.gplus = {
    "key": "gplus",
    "type": "social",
    "name": "Google+",
    "uri": "https://policies.google.com/privacy",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";
        tarteaucitron.addScript('https://apis.google.com/js/platform.js');
    },
    "fallback": function () {
        "use strict";
        var id = 'gplus';
        tarteaucitron.fallback(['g-plus', 'g-plusone'], tarteaucitron.engage(id));
    }
};

// google+ badge
tarteaucitron.services.gplusbadge = {
    "key": "gplusbadge",
    "type": "social",
    "name": "Google+ (badge)",
    "uri": "https://policies.google.com/privacy",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";
        tarteaucitron.addScript('https://apis.google.com/js/platform.js');
    },
    "fallback": function () {
        "use strict";
        var id = 'gplusbadge';
        tarteaucitron.fallback(['g-page', 'g-person'], tarteaucitron.engage(id));
    }
};

// google adsense
tarteaucitron.services.adsense = {
    "key": "adsense",
    "type": "ads",
    "name": "Google Adsense",
    "uri": "https://adssettings.google.com/",
    "needConsent": true,
    "readmoreLink": "https://policies.google.com/technologies/partner-sites",
    "cookies": ['__gads'],
    "js": function () {
        "use strict";
        tarteaucitron.fallback(['adsbygoogle'], '');
        tarteaucitron.addScript('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js');
    },
    "fallback": function () {
        "use strict";
        var id = 'adsense';
        tarteaucitron.fallback(['adsbygoogle'], tarteaucitron.engage(id));
    }
};


// google adsense automatic
tarteaucitron.services.adsenseauto = {
    "key": "adsenseauto",
    "type": "ads",
    "name": "Google Adsense Automatic",
    "uri": "https://adssettings.google.com/",
    "needConsent": true,
    "readmoreLink": "https://policies.google.com/technologies/partner-sites",
    "cookies": ['__gads'],
    "js": function () {
        "use strict";

        if (tarteaucitron.user.adsensecapub === undefined) {
            return;
        }
        tarteaucitron.addScript('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + tarteaucitron.user.adsensecapub, '', '', '', 'crossorigin', 'anonymous');
    }
};

// Google Adsense Search
tarteaucitron.services.adsensesearch = {
    "key": "adsensesearch",
    "type": "ads",
    "name": "Google Adsense Search",
    "uri": "https://adssettings.google.com/",
    "needConsent": true,
    "readmoreLink": "https://policies.google.com/technologies/partner-sites",
    "cookies": ['__gads'],
    "js": function () {
        "use strict";
        tarteaucitron.addScript('https://www.google.com/adsense/search/ads.js');
    },
    "fallback": function () {
        "use strict";
        var id = 'adsensesearch';
        tarteaucitron.fallback(['afscontainer1'], tarteaucitron.engage(id));
    }
};

// google partners badge
tarteaucitron.services.googlepartners = {
    "key": "googlepartners",
    "type": "ads",
    "name": "Google Partners Badge",
    "uri": "https://adssettings.google.com/",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";
        tarteaucitron.addScript('https://apis.google.com/js/platform.js');
    },
    "fallback": function () {
        "use strict";
        var id = 'googlepartners';
        tarteaucitron.fallback(['g-partnersbadge'], tarteaucitron.engage(id));
    }
};

// google adsense search (form)
tarteaucitron.services.adsensesearchform = {
    "key": "adsensesearchform",
    "type": "ads",
    "name": "Google Adsense Search (form)",
    "uri": "https://adssettings.google.com/",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";
        tarteaucitron.addScript('//www.google.com/coop/cse/brand?form=cse-search-box&lang=' + tarteaucitron.getLanguage());
    }
};

// google adsense search (result)
tarteaucitron.services.adsensesearchresult = {
    "key": "adsensesearchresult",
    "type": "ads",
    "name": "Google Adsense Search (result)",
    "uri": "https://adssettings.google.com/",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";
        if (tarteaucitron.user.adsensesearchresultCx === undefined) {
            return;
        }
        tarteaucitron.addScript('//www.google.com/cse/cse.js?cx=' + tarteaucitron.user.adsensesearchresultCx);
    },
    "fallback": function () {
        "use strict";
        var id = 'adsensesearchresult';

        if (document.getElementById('gcse_searchresults')) {
            document.getElementById('gcse_searchresults').innerHTML = tarteaucitron.engage(id);
        }
    }
};

// googleadwordsconversion
tarteaucitron.services.googleadwordsconversion = {
    "key": "googleadwordsconversion",
    "type": "ads",
    "name": "Google Adwords (conversion)",
    "uri": "https://www.google.com/settings/ads",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";
        if (tarteaucitron.user.adwordsconversionId === undefined) {
            return;
        }

        tarteaucitron.addScript('//www.googleadservices.com/pagead/conversion_async.js', '', function () {
            window.google_trackConversion({
                google_conversion_id: tarteaucitron.user.adwordsconversionId,
                google_conversion_label: tarteaucitron.user.adwordsconversionLabel,
                google_conversion_language: tarteaucitron.user.adwordsconversionLanguage,
                google_conversion_format: tarteaucitron.user.adwordsconversionFormat,
                google_conversion_color: tarteaucitron.user.adwordsconversionColor,
                google_conversion_value: tarteaucitron.user.adwordsconversionValue,
                google_conversion_currency: tarteaucitron.user.adwordsconversionCurrency,
                google_custom_params: {
                    parameter1: tarteaucitron.user.adwordsconversionCustom1,
                    parameter2: tarteaucitron.user.adwordsconversionCustom2
                }
            });
        });
    }
};

// googleadwordsremarketing
tarteaucitron.services.googleadwordsremarketing = {
    "key": "googleadwordsremarketing",
    "type": "ads",
    "name": "Google Adwords (remarketing)",
    "uri": "https://www.google.com/settings/ads",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";
        if (tarteaucitron.user.adwordsremarketingId === undefined) {
            return;
        }

        tarteaucitron.addScript('//www.googleadservices.com/pagead/conversion_async.js', '', function () {
            window.google_trackConversion({
                google_conversion_id: tarteaucitron.user.adwordsremarketingId,
                google_remarketing_only: true
            });
        });
    }
};

// google analytics (old)
tarteaucitron.services.gajs = {
    "key": "gajs",
    "type": "analytic",
    "name": "Google Analytics (ga.js)",
    "uri": "https://policies.google.com/privacy",
    "needConsent": true,
    "cookies": (function () {
        var googleIdentifier = tarteaucitron.user.gajsUa,
            tagUaCookie = '_gat_gtag_' + googleIdentifier,
            tagGCookie = '_ga_' + googleIdentifier;

        tagUaCookie = tagUaCookie.replace(/-/g, '_');
        tagGCookie = tagGCookie.replace(/G-/g, '');

        return ['_ga', '_gat', '_gid', '__utma', '__utmb', '__utmc', '__utmt', '__utmz', tagUaCookie, tagGCookie, '_gcl_au'];
    })(),
    "js": function () {
        "use strict";
        window._gaq = window._gaq || [];
        window._gaq.push(['_setAccount', tarteaucitron.user.gajsUa]);
        if (timeExpire !== undefined) {
            _gaq.push(['_setVisitorCookieTimeout', timeExpire]);
        }

        if (tarteaucitron.user.gajsAnonymizeIp) {
            window._gaq.push(['_gat._anonymizeIp']);
        }

        if (tarteaucitron.user.gajsPageView) {
            window._gaq.push(['_trackPageview, ' + tarteaucitron.user.gajsPageView]);
        } else {
            window._gaq.push(['_trackPageview']);
        }

        tarteaucitron.addScript('//www.google-analytics.com/ga.js', '', function () {
            if (typeof tarteaucitron.user.gajsMore === 'function') {
                tarteaucitron.user.gajsMore();
            }
        });
    }
};

// google analytics
tarteaucitron.services.analytics = {
    "key": "analytics",
    "type": "analytic",
    "name": "Google Analytics (universal)",
    "uri": "https://policies.google.com/privacy",
    "needConsent": true,
    "cookies": (function () {
        var googleIdentifier = tarteaucitron.user.analyticsUa,
            tagUaCookie = '_gat_gtag_' + googleIdentifier,
            tagGCookie = '_ga_' + googleIdentifier;

        tagUaCookie = tagUaCookie.replace(/-/g, '_');
        tagGCookie = tagGCookie.replace(/G-/g, '');

        return ['_ga', '_gat', '_gid', '__utma', '__utmb', '__utmc', '__utmt', '__utmz', tagUaCookie, tagGCookie, '_gcl_au'];
    })(),
    "js": function () {
        "use strict";
        window.GoogleAnalyticsObject = 'ga';
        window.ga = window.ga || function () {
            window.ga.q = window.ga.q || [];
            window.ga.q.push(arguments);
        };
        window.ga.l = new Date();
        tarteaucitron.addScript('https://www.google-analytics.com/analytics.js', '', function () {
            var uaCreate = { 'cookieExpires': (timeExpire !== undefined) ? timeExpire : 34128000 };
            tarteaucitron.extend(uaCreate, tarteaucitron.user.analyticsUaCreate || {});
            ga('create', tarteaucitron.user.analyticsUa, uaCreate);

            if (tarteaucitron.user.analyticsAnonymizeIp) {
                ga('set', 'anonymizeIp', true);
            }

            if (typeof tarteaucitron.user.analyticsPrepare === 'function') {
                tarteaucitron.user.analyticsPrepare();
            }

            if (tarteaucitron.user.analyticsPageView) {
                ga('send', 'pageview', tarteaucitron.user.analyticsPageView);
            } else {
                ga('send', 'pageview');
            }

            if (typeof tarteaucitron.user.analyticsMore === 'function') {
                tarteaucitron.user.analyticsMore();
            }
        });
    }
};

// google ads
tarteaucitron.services.googleads = {
    "key": "googleads",
    "type": "ads",
    "name": "Google Ads",
    "uri": "https://policies.google.com/privacy",
    "needConsent": true,
    "cookies": (function () {
        var googleIdentifier = tarteaucitron.user.googleadsId,
            tagUaCookie = '_gat_gtag_' + googleIdentifier,
            tagGCookie = '_ga_' + googleIdentifier;

        tagUaCookie = tagUaCookie.replace(/-/g, '_');
        tagGCookie = tagGCookie.replace(/G-/g, '');

        return ['_ga', '_gat', '_gid', '__utma', '__utmb', '__utmc', '__utmt', '__utmz', tagUaCookie, tagGCookie, '_gcl_au'];
    })(),
    "js": function () {
        "use strict";
        window.dataLayer = window.dataLayer || [];
        tarteaucitron.addScript('https://www.googletagmanager.com/gtag/js?id=' + tarteaucitron.user.googleadsId, '', function () {
            window.gtag = function gtag() { dataLayer.push(arguments); }
            gtag('js', new Date());
            var additional_config_info = (timeExpire !== undefined) ? {'anonymize_ip': true, 'cookie_expires': timeExpire / 1000} : {'anonymize_ip': true};

            gtag('config', tarteaucitron.user.googleadsId, additional_config_info);

            if (typeof tarteaucitron.user.googleadsMore === 'function') {
                tarteaucitron.user.googleadsMore();
            }
        });
    }
};

// google analytics
tarteaucitron.services.gtag = {
    "key": "gtag",
    "type": "analytic",
    "name": "Google Analytics (GA4)",
    "uri": "https://policies.google.com/privacy",
    "needConsent": true,
    "cookies": (function () {
        var googleIdentifier = tarteaucitron.user.gtagUa,
            tagUaCookie = '_gat_gtag_' + googleIdentifier,
            tagGCookie = '_ga_' + googleIdentifier;

        tagUaCookie = tagUaCookie.replace(/-/g, '_');
        tagGCookie = tagGCookie.replace(/G-/g, '');

        return ['_ga', '_gat', '_gid', '__utma', '__utmb', '__utmc', '__utmt', '__utmz', tagUaCookie, tagGCookie, '_gcl_au'];
    })(),
    "js": function () {
        "use strict";
        window.dataLayer = window.dataLayer || [];
        tarteaucitron.addScript('https://www.googletagmanager.com/gtag/js?id=' + tarteaucitron.user.gtagUa, '', function () {
            window.gtag = function gtag() { dataLayer.push(arguments); }
            gtag('js', new Date());
            var additional_config_info = (timeExpire !== undefined) ? {'anonymize_ip': true, 'cookie_expires': timeExpire / 1000} : {'anonymize_ip': true};

            if (tarteaucitron.user.gtagCrossdomain) {
                /**
                 * https://support.google.com/analytics/answer/7476333?hl=en
                 * https://developers.google.com/analytics/devguides/collection/gtagjs/cross-domain
                 */
                gtag('config', tarteaucitron.user.gtagUa, additional_config_info, { linker: { domains: tarteaucitron.user.gtagCrossdomain, } });
            } else {
                gtag('config', tarteaucitron.user.gtagUa, additional_config_info);
            }

            if (typeof tarteaucitron.user.gtagMore === 'function') {
                tarteaucitron.user.gtagMore();
            }
        });
    }
};

tarteaucitron.services.firebase = {
    "key": "firebase",
    "type": "analytic",
    "name": "Firebase",
    "uri": "https://firebase.google.com/support/privacy",
    "needConsent": true,
    "cookies": (function () {
        var googleIdentifier = tarteaucitron.user.firebaseMeasurementId,
            tagGCookie = '_ga_' + googleIdentifier;

        tagGCookie = tagGCookie.replace(/G-/g, '');

        return ['_ga', tagGCookie];
    })(),
    "js": function () {
        "use strict";

        if (tarteaucitron.user.firebaseApiKey === undefined) {
            return;
        }

        tarteaucitron.addScript('https://www.gstatic.com/firebasejs/8.6.2/firebase-app.js', '', function () {
            tarteaucitron.addScript('https://www.gstatic.com/firebasejs/8.6.2/firebase-analytics.js', '', function () {

                var firebaseConfig = {
                    apiKey: tarteaucitron.user.firebaseApiKey,
                    authDomain: tarteaucitron.user.firebaseAuthDomain,
                    databaseURL: tarteaucitron.user.firebaseDatabaseUrl,
                    projectId: tarteaucitron.user.firebaseProjectId,
                    storageBucket: tarteaucitron.user.firebaseStorageBucket,
                    appId: tarteaucitron.user.firebaseAppId,
                    measurementId: tarteaucitron.user.firebaseMeasurementId,
                };
                firebase.initializeApp(firebaseConfig);
                firebase.analytics();
            });
        });
    }
};

// genially
tarteaucitron.services.genially = {
    "key": "genially",
    "type": "api",
    "name": "genially",
    "uri": "https://www.genial.ly/cookies",
    "needConsent": true,
    "cookies": ['_gat', '_ga', '_gid'],
    "js": function () {
        "use strict";

        tarteaucitron.fallback(['tac_genially'], function (x) {
            var frame_title = tarteaucitron.fixSelfXSS(x.getAttribute("title") || 'genially iframe'),
                width = x.getAttribute("width"),
                height = x.getAttribute("height"),
                geniallyid = x.getAttribute("geniallyid"),
                allowfullscreen = x.getAttribute("allowfullscreen");

            return '<div style="position: relative; padding-bottom: 109.00%; padding-top: 0; height: 0;"><iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" title="' + frame_title + '" src="https://view.genial.ly/' + geniallyid + '" width="' + width + '" height="' + height + '" scrolling="auto" allowtransparency ' + (allowfullscreen == '0' ? '' : ' webkitallowfullscreen mozallowfullscreen allowfullscreen') + '></iframe></div>';
        });
    },
    "fallback": function () {
        "use strict";
        var id = 'genially';
        tarteaucitron.fallback(['tac_genially'], function (elem) {
            elem.style.width = elem.getAttribute('width') + 'px';
            elem.style.height = elem.getAttribute('height') + 'px';
            return tarteaucitron.engage(id);
        });
    }
};

// google maps
tarteaucitron.services.googlemaps = {
    "key": "googlemaps",
    "type": "api",
    "name": "Google Maps",
    "uri": "https://policies.google.com/privacy",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";
        var mapOptions,
            map,
            uniqIds = [],
            i;

        if (tarteaucitron.user.mapscallback === undefined) {
            tarteaucitron.user.mapscallback = 'tac_googlemaps_callback';
        }

        // Add Google Maps libraries if any (https://developers.google.com/maps/documentation/javascript/libraries)
        var googleMapsLibraries = '';
        if (tarteaucitron.user.googlemapsLibraries) {
            googleMapsLibraries = '&libraries=' + tarteaucitron.user.googlemapsLibraries;
        }

        tarteaucitron.addScript('//maps.googleapis.com/maps/api/js?v=3.exp&key=' + tarteaucitron.user.googlemapsKey + '&callback=' + tarteaucitron.user.mapscallback + googleMapsLibraries);

        window.tac_googlemaps_callback = function () {
            tarteaucitron.fallback(['googlemaps-canvas'], function (x) {
                var uniqId = '_' + Math.random().toString(36).substr(2, 9);
                uniqIds.push(uniqId);
                return '<div id="' + uniqId + '" zoom="' + x.getAttribute('zoom') + '" latitude="' + x.getAttribute('latitude') + '" longitude="' + x.getAttribute('longitude') + '" style="width:' + x.offsetWidth + 'px;height:' + x.offsetHeight + 'px"></div>';
            });

            var i;
            for (i = 0; i < uniqIds.length; i += 1) {
                mapOptions = {
                    zoom: parseInt(document.getElementById(uniqIds[i]).getAttribute('zoom'), 10),
                    center: new google.maps.LatLng(parseFloat(document.getElementById(uniqIds[i]).getAttribute('latitude'), 10), parseFloat(document.getElementById(uniqIds[i]).getAttribute('longitude'), 10))
                };
                map = new google.maps.Map(document.getElementById(uniqIds[i]), mapOptions);
                new google.maps.Marker({ position: { lat: parseFloat(document.getElementById(uniqIds[i]).getAttribute('latitude'), 10), lng: parseFloat(document.getElementById(uniqIds[i]).getAttribute('longitude'), 10) }, map: map });
            }
        };
    },
    "fallback": function () {
        "use strict";
        var id = 'googlemaps';
        tarteaucitron.fallback(['googlemaps-canvas'], tarteaucitron.engage(id));
    }
};

// googlemaps search
tarteaucitron.services.googlemapssearch = {
    "key": "googlemapssearch",
    "type": "api",
    "name": "Google Maps Search API",
    "uri": "https://policies.google.com/privacy",
    "needConsent": true,
    "cookies": ['nid'],
    "js": function () {
        "use strict";
        tarteaucitron.fallback(['googlemapssearch'], function (x) {
            var frame_title = tarteaucitron.fixSelfXSS(x.getAttribute("title") || 'Google search iframe'),
                width = x.getAttribute("width"),
                height = x.getAttribute("height"),
                // url = x.getAttribute("data-url");
                query = escape(x.getAttribute("data-search")),
                key = x.getAttribute("data-api-key");

            return '<iframe title="' + frame_title + '" width="' + width + '" height="' + height + '" style="border:0" src="https://www.google.com/maps/embed/v1/place?q=' + query + '&key=' + key + '" allowfullscreen></iframe> '
        });
    },
    "fallback": function () {
        "use strict";
        var id = 'googlemapssearch';
        tarteaucitron.fallback(['googlemapssearch'], function (elem) {
            elem.style.width = elem.getAttribute('width') + 'px';
            elem.style.height = elem.getAttribute('height') + 'px';
            return tarteaucitron.engage(id);
        });
    }
};

// googlemaps embed iframe
tarteaucitron.services.googlemapsembed = {
    "key": "googlemapsembed",
    "type": "api",
    "name": "Google Maps Embed",
    "uri": "https://policies.google.com/privacy",
    "needConsent": true,
    "cookies": ['apisid', 'hsid', 'nid', 'sapisid', 'sid', 'sidcc', 'ssid', '1p_jar'],
    "js": function () {
        "use strict";
        tarteaucitron.fallback(['googlemapsembed'], function (x) {
            var frame_title = tarteaucitron.fixSelfXSS(x.getAttribute("title") || 'Google maps iframe'),
                width = tarteaucitron.getElemWidth(x),
                height = tarteaucitron.getElemHeight(x),
                url = x.getAttribute("data-url");

            return '<iframe title="' + frame_title + '" src="' + url + '" width="' + width + '" height="' + height + '" scrolling="no" allowtransparency allowfullscreen></iframe>';
        });
    },
    "fallback": function () {
        "use strict";
        var id = 'googlemapsembed';
        tarteaucitron.fallback(['googlemapsembed'], function (elem) {
            elem.style.width = tarteaucitron.getElemWidth(elem) + 'px';
            elem.style.height = tarteaucitron.getElemHeight(elem) + 'px';
            return tarteaucitron.engage(id);
        });
    }
};


// openstreetmap embed iframe
tarteaucitron.services.openstreetmap = {
    "key": "openstreetmap",
    "type": "api",
    "name": "Openstreetmap Embed",
    "uri": "https://wiki.osmfoundation.org/wiki/Privacy_Policy#Cookies",
    "needConsent": true,
    "cookies": ['apisid', 'hsid', 'nid', 'sapisid', 'sid', 'sidcc', 'ssid', '1p_jar'],
    "js": function () {
        "use strict";
        tarteaucitron.fallback(['openstreetmap'], function (x) {
            var width = tarteaucitron.getElemWidth(x),
                height = tarteaucitron.getElemHeight(x),
                url = x.getAttribute("data-url");

            return '<iframe src="' + url + '" width="' + width + '" height="' + height + '" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" allowfullscreen></iframe>';
        });
    },
    "fallback": function () {
        "use strict";
        var id = 'openstreetmap';
        tarteaucitron.fallback(['openstreetmap'], function (elem) {
            elem.style.width = tarteaucitron.getElemWidth(elem) + 'px';
            elem.style.height = tarteaucitron.getElemHeight(elem) + 'px';
            return tarteaucitron.engage(id);
        });
    }
};

// geoportail embed iframe
tarteaucitron.services.geoportail = {
    "key": "geoportail",
    "type": "api",
    "name": "Geoportail maps Embed",
    "uri": "https://www.ign.fr/institut/gestion-des-cookies",
    "needConsent": true,
    "cookies": ['apisid', 'hsid', 'nid', 'sapisid', 'sid', 'sidcc', 'ssid', '1p_jar'],
    "js": function () {
        "use strict";
        tarteaucitron.fallback(['geoportail'], function (x) {
            var width = tarteaucitron.getElemWidth(x),
                height = tarteaucitron.getElemHeight(x),
                url = x.getAttribute("data-url");

            return '<iframe src="' + url + '" width="' + width + '" height="' + height + '" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" sandbox="allow-forms allow-scripts allow-same-origin" allowfullscreen></iframe>';
        });
    },
    "fallback": function () {
        "use strict";
        var id = 'geoportail';
        tarteaucitron.fallback(['geoportail'], function (elem) {
            elem.style.width = tarteaucitron.getElemWidth(elem) + 'px';
            elem.style.height = tarteaucitron.getElemHeight(elem) + 'px';
            return tarteaucitron.engage(id);
        });
    }
};


// google tag manager
tarteaucitron.services.googletagmanager = {
    "key": "googletagmanager",
    "type": "api",
    "name": "Google Tag Manager",
    "uri": "https://policies.google.com/privacy",
    "needConsent": true,
    "cookies": ['_ga', '_gat', '__utma', '__utmb', '__utmc', '__utmt', '__utmz', '__gads', '_drt_', 'FLC', 'exchange_uid', 'id', 'fc', 'rrs', 'rds', 'rv', 'uid', 'UIDR', 'UID', 'clid', 'ipinfo', 'acs'],
    "js": function () {
        "use strict";
        if (tarteaucitron.user.googletagmanagerId === undefined) {
            return;
        }
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
            'gtm.start': new Date().getTime(),
            event: 'gtm.js'
        });
        tarteaucitron.addScript('https://www.googletagmanager.com/gtm.js?id=' + tarteaucitron.user.googletagmanagerId);
    }
};

// google tag manager multiple
tarteaucitron.services.multiplegoogletagmanager = {
    "key": "multiplegoogletagmanager",
    "type": "api",
    "name": "Google Tag Manager",
    "uri": "https://policies.google.com/privacy",
    "needConsent": true,
    "cookies": ['_ga', '_gat', '__utma', '__utmb', '__utmc', '__utmt', '__utmz', '__gads', '_drt_', 'FLC', 'exchange_uid', 'id', 'fc', 'rrs', 'rds', 'rv', 'uid', 'UIDR', 'UID', 'clid', 'ipinfo', 'acs'],
    "js": function () {
        "use strict";
        if (tarteaucitron.user.multiplegoogletagmanagerId === undefined) {
            return;
        }
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
            'gtm.start': new Date().getTime(),
            event: 'gtm.js'
        });

        tarteaucitron.user.multiplegoogletagmanagerId.forEach(function (id) {
            tarteaucitron.addScript('https://www.googletagmanager.com/gtm.js?id=' + id);
        });

    }
};

// google webfonts
tarteaucitron.services.googlefonts = {
    "key": "googlefonts",
    "type": "api",
    "name": "Google Webfonts",
    "uri": "https://policies.google.com/privacy",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";
        if (tarteaucitron.user.googleFonts === undefined) {
            return;
        }
        tarteaucitron.addScript('//ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js', '', function () {
            WebFont.load({
                google: {
                    families: tarteaucitron.user.googleFonts
                }
            });
        });
    }
};

// hubspot
tarteaucitron.services.hubspot = {
    "key": "hubspot",
    "type": "analytic",
    "name": "Hubspot",
    "uri": "https://legal.hubspot.com/privacy-policy",
    "needConsent": true,
    "cookies": ['hubspotutk', 'fr', '__hstc', '__hssrc', '__hssc', '__cfduid'],
    "js": function () {
        "use strict";
        tarteaucitron.addScript('//js.hs-scripts.com/' + tarteaucitron.user.hubspotId + '.js', 'hs-script-loader');
    }
};

// instagram
tarteaucitron.services.instagram = {
    "key": "instagram",
    "type": "social",
    "name": "Instagram",
    "uri": "https://www.instagram.com/legal/privacy/",
    "needConsent": true,
    "cookies": ['shbts', 'sessionid', 'csrftoken', 'rur', 'shbid', 'mid', 'ds_usr_id', 'ig_did', 'ig_cb', 'datr'],
    "js": function () {
        "use strict";
        tarteaucitron.fallback(['instagram_post'], function (x) {
            var frame_title = tarteaucitron.fixSelfXSS(x.getAttribute("title") || 'Instagram iframe'),
                post_id = x.getAttribute('postId'),
                post_permalink = x.getAttribute('data-instgrm-permalink'),
                embed_width = x.getAttribute('width'),
                embed_height = x.getAttribute('height'),
                frame_width,
                frame_height,
                post_frame;

            if (post_permalink != null) {
                tarteaucitron.addScript('//www.instagram.com/embed.js', 'instagram-embed');

                return '';
            }

            if (post_id === undefined) {
                return "";
            }

            if (embed_width !== undefined) {
                frame_width = 'width="' + embed_width + '" ';
            } else {
                frame_width = '"" ';
            }
            if (embed_height !== undefined) {
                frame_height = 'height="' + embed_height + '" ';
            } else {
                frame_height = '"" ';
            }

            post_frame = '<iframe title="' + frame_title + '" src="//www.instagram.com/' + post_id + '/embed" ' + frame_width + frame_height + '></iframe>';

            return post_frame;
        });
    },
    "fallback": function () {
        "use strict";
        var id = 'instagram';
        tarteaucitron.fallback(['instagram_post'], function (elem) {
            elem.style.width = elem.getAttribute('width') + 'px';
            elem.style.height = elem.getAttribute('height') + 'px';
            return tarteaucitron.engage(id);
        });
    }
};

// jsapi
tarteaucitron.services.jsapi = {
    "key": "jsapi",
    "type": "api",
    "name": "Google jsapi",
    "uri": "https://policies.google.com/privacy",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";
        tarteaucitron.addScript('//www.google.com/jsapi');
    }
};

// twitterwidgetsapi
tarteaucitron.services.twitterwidgetsapi = {
    "key": "twitterwidgetsapi",
    "type": "api",
    "name": "Twitter Widgets API",
    "uri": "https://support.twitter.com/articles/20170514",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";
        tarteaucitron.fallback(['tacTwitterAPI'], '');
        tarteaucitron.addScript('//platform.twitter.com/widgets.js', 'twitter-wjs');
    },
    "fallback": function () {
        "use strict";
        var id = 'twitterwidgetsapi';
        tarteaucitron.fallback(['tacTwitterAPI'], tarteaucitron.engage(id));
    }
};

// recaptcha
tarteaucitron.services.recaptcha = {
    "key": "recaptcha",
    "type": "api",
    "name": "reCAPTCHA",
    "uri": "https://policies.google.com/privacy",
    "needConsent": true,
    "cookies": ['nid'],
    "js": function () {
        "use strict";
        window.tacRecaptchaOnLoad = tarteaucitron.user.recaptchaOnLoad || function () { };
        tarteaucitron.fallback(['g-recaptcha'], '');

        if (tarteaucitron.user.recaptchaapi === undefined) {
            tarteaucitron.addScript('https://www.google.com/recaptcha/api.js?onload=tacRecaptchaOnLoad');
        } else {
            tarteaucitron.addScript('https://www.google.com/recaptcha/api.js?onload=tacRecaptchaOnLoad&render=' + tarteaucitron.user.recaptchaapi);
        }

    },
    "fallback": function () {
        "use strict";
        var id = 'recaptcha';
        tarteaucitron.fallback(['g-recaptcha'], tarteaucitron.engage(id));
    }
};

// linkedin
tarteaucitron.services.linkedin = {
    "key": "linkedin",
    "type": "social",
    "name": "Linkedin",
    "uri": "https://www.linkedin.com/legal/cookie_policy",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";
        tarteaucitron.fallback(['tacLinkedin'], '');
        tarteaucitron.addScript('//platform.linkedin.com/in.js');
        if (tarteaucitron.isAjax === true) {
            if (typeof IN !== "undefined") {
                IN.parse();
            }
        }
    },
    "fallback": function () {
        "use strict";
        var id = 'linkedin';
        tarteaucitron.fallback(['tacLinkedin'], tarteaucitron.engage(id));
    }
};

// mautic
tarteaucitron.services.mautic = {
    "key": "mautic",
    "type": "analytic",
    "name": "Mautic",
    "uri": "https://www.mautic.org/privacy-policy/",
    "needConsent": true,
    "cookies": ['mtc_id', 'mtc_sid'],
    "js": function () {
        "use strict";
        if (tarteaucitron.user.mauticurl === undefined) {
            return;
        }

        window.MauticTrackingObject = 'mt';
        window.mt = window.mt || function () {
            window.mt.q = window.mt.q || [];
            window.mt.q.push(arguments);
        };

        tarteaucitron.addScript(tarteaucitron.user.mauticurl, '', function () {
            mt('send', 'pageview');
        });
    }
};

// microsoftcampaignanalytics
tarteaucitron.services.microsoftcampaignanalytics = {
    "key": "microsoftcampaignanalytics",
    "type": "analytic",
    "name": "Microsoft Campaign Analytics",
    "uri": "https://privacy.microsoft.com/privacystatement/",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";
        if (tarteaucitron.user.microsoftcampaignanalyticsUUID === undefined) {
            return;
        }

        tarteaucitron.addScript('//flex.atdmt.com/mstag/site/' + tarteaucitron.user.microsoftcampaignanalyticsUUID + '/mstag.js', 'mstag_tops', function () {
            window.mstag = { loadTag: function () { }, time: (new Date()).getTime() };
            window.mstag.loadTag("analytics", { dedup: "1", domainId: tarteaucitron.user.microsoftcampaignanalyticsdomainId, type: "1", actionid: tarteaucitron.user.microsoftcampaignanalyticsactionId });
        });
    }
};

// onesignal
tarteaucitron.services.onesignal = {
    "key": "onesignal",
    "type": "api",
    "name": "OneSignal",
    "uri": "https://onesignal.com/privacy_policy",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";
        if (tarteaucitron.user.onesignalAppId === undefined) {
            return;
        }
        window.OneSignal = window.OneSignal || [];

        window.OneSignal.push(function () {
            window.OneSignal.init({
                appId: tarteaucitron.user.onesignalAppId,
            });
        });

        tarteaucitron.addScript('https://cdn.onesignal.com/sdks/OneSignalSDK.js');
    }
};

// pinterest
tarteaucitron.services.pinterest = {
    "key": "pinterest",
    "type": "social",
    "name": "Pinterest",
    "uri": "https://about.pinterest.com/privacy-policy",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";
        tarteaucitron.fallback(['tacPinterest'], '');
        tarteaucitron.addScript('//assets.pinterest.com/js/pinit.js');
    },
    "fallback": function () {
        "use strict";
        var id = 'pinterest';
        tarteaucitron.fallback(['tacPinterest'], tarteaucitron.engage(id));
    }
};

// prelinker
tarteaucitron.services.prelinker = {
    "key": "prelinker",
    "type": "ads",
    "name": "Prelinker",
    "uri": "http://www.prelinker.com/index/index/cgu/",
    "needConsent": true,
    "cookies": ['_sp_id.32f5', '_sp_ses.32f5'],
    "js": function () {
        "use strict";
        var uniqIds = [],
            i,
            uri;

        tarteaucitron.fallback(['prelinker-canvas'], function (x) {
            var uniqId = '_' + Math.random().toString(36).substr(2, 9);
            uniqIds.push(uniqId);
            return '<div id="' + uniqId + '" siteId="' + x.getAttribute('siteId') + '" bannerId="' + x.getAttribute('bannerId') + '" defaultLanguage="' + x.getAttribute('defaultLanguage') + '" tracker="' + x.getAttribute('tracker') + '"></div>';
        });

        for (i = 0; i < uniqIds.length; i += 1) {
            uri = 'http://promo.easy-dating.org/banner/index?';
            uri += 'site_id=' + document.getElementById(uniqIds[i]).getAttribute('siteId') + '&';
            uri += 'banner_id=' + document.getElementById(uniqIds[i]).getAttribute('bannerId') + '&';
            uri += 'default_language=' + document.getElementById(uniqIds[i]).getAttribute('defaultLanguage') + '&';
            uri += 'tr4ck=' + document.getElementById(uniqIds[i]).getAttribute('trackrt');

            tarteaucitron.makeAsync.init(uri, uniqIds[i]);
        }
    },
    "fallback": function () {
        "use strict";
        var id = 'prelinker';
        tarteaucitron.fallback(['prelinker-canvas'], tarteaucitron.engage(id));
    }
};

// prezi
tarteaucitron.services.prezi = {
    "key": "prezi",
    "type": "video",
    "name": "Prezi",
    "uri": "https://prezi.com/privacy-policy/",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";
        tarteaucitron.fallback(['prezi-canvas'], function (x) {
            var frame_title = tarteaucitron.fixSelfXSS(x.getAttribute("title") || 'Prezi iframe'),
                id = x.getAttribute("data-id"),
                width = x.getAttribute("width"),
                height = x.getAttribute("height"),
                url = 'https://prezi.com/embed/' + id + '/?bgcolor=ffffff&amp;lock_to_path=0&amp;autoplay=0&amp;autohide_ctrls=0';

            return '<iframe title="' + frame_title + '" src="' + url + '" width="' + width + '" height="' + height + '" scrolling="no" allowtransparency allowfullscreen></iframe>';
        });
    },
    "fallback": function () {
        "use strict";
        var id = 'prezi';
        tarteaucitron.fallback(['prezi-canvas'], function (elem) {
            elem.style.width = elem.getAttribute('width') + 'px';
            elem.style.height = elem.getAttribute('height') + 'px';
            return tarteaucitron.engage(id);
        });
    }
};

// pubdirecte
tarteaucitron.services.pubdirecte = {
    "key": "pubdirecte",
    "type": "ads",
    "name": "Pubdirecte",
    "uri": "http://pubdirecte.com/contact.php",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";
        var uniqIds = [],
            i,
            uri;

        tarteaucitron.fallback(['pubdirecte-canvas'], function (x) {
            var uniqId = '_' + Math.random().toString(36).substr(2, 9);
            uniqIds.push(uniqId);
            return '<div id="' + uniqId + '" pid="' + x.getAttribute('pid') + '" ref="' + x.getAttribute('ref') + '"></div>';
        });

        for (i = 0; i < uniqIds.length; i += 1) {
            uri = '//www.pubdirecte.com/script/banniere.php?';
            uri += 'id=' + document.getElementById(uniqIds[i]).getAttribute('pid') + '&';
            uri += 'ref=' + document.getElementById(uniqIds[i]).getAttribute('ref');

            tarteaucitron.makeAsync.init(uri, uniqIds[i]);
        }
    },
    "fallback": function () {
        "use strict";
        var id = 'pubdirecte';
        tarteaucitron.fallback(['pubdirecte-canvas'], tarteaucitron.engage(id));
    }
};

// purechat
tarteaucitron.services.purechat = {
    "key": "purechat",
    "type": "support",
    "name": "PureChat",
    "uri": "https://www.purechat.com/privacy",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";
        if (tarteaucitron.user.purechatId === undefined) {
            return;
        }

        tarteaucitron.addScript('//app.purechat.com/VisitorWidget/WidgetScript', '', function () {
            try {
                window.w = new PCWidget({ c: tarteaucitron.user.purechatId, f: true });
            } catch (e) { }
        });
    }
};

// Intercom
tarteaucitron.services.intercomChat = {
    "key": "intercomChat",
    "type": "support",
    "name": "Intercom",
    "uri": "https://www.intercom.com/",
    "needConsent": true,
    "cookies": [
        "intercom-id-" + tarteaucitron.user.intercomKey,
        "intercom-session-" + tarteaucitron.user.intercomKey,
    ],
    "readmoreLink": "https://www.intercom.com/legal/privacy",
    "js": function () {
        window.intercomSettings = {
            app_id: tarteaucitron.user.intercomKey,
        };

        var w = window;
        var ic = w.Intercom;
        if (typeof ic === "function") {
            ic("reattach_activator");
            ic("update", w.intercomSettings);
        } else {
            var i = function () {
                i.c(arguments);
            };
            i.q = [];
            i.c = function (args) {
                i.q.push(args);
            };
            w.Intercom = i;
            tarteaucitron.addScript(
                "https://widget.intercom.io/widget/" + tarteaucitron.user.intercomKey,
                "",
                function () {
                    // Execute callback if function `intercomChatEnable`
                    // is defined
                    if (typeof intercomChatEnable === 'function') {
                        intercomChatEnable()
                    }
                }
            );
        }
    },
    "fallback": function () {
        "use strict";
        var id = "intercomChat";
        tarteaucitron.fallback(
            ["intercom-chat"],
            function () {
                // Execute callback if function `intercomChatDisable`
                // is defined
                if (typeof intercomChatDisable === 'function') {
                    intercomChatDisable()
                }
                return tarteaucitron.engage(id)
            }
        );
    },
};

// rumbletalk
tarteaucitron.services.rumbletalk = {
    "key": "rumbletalk",
    "type": "social",
    "name": "RumbleTalk",
    "needConsent": true,
    "cookies": ['AWSALB'],
    "js": function () {
        "use strict";
        if (tarteaucitron.user.rumbletalkid === undefined) {
            return;
        }

        tarteaucitron.addScript('https://rumbletalk.com/client/?' + tarteaucitron.user.rumbletalkid);

        tarteaucitron.fallback(['rumbletalk'], function (x) {
            var width = tarteaucitron.getElemWidth(x),
                height = tarteaucitron.getElemHeight(x),
                id = x.getAttribute("data-id");

            return '<div style="height: ' + height + 'px; width: ' + width + 'px;"><div id="' + id + '"></div></div>';
        });
    },
    "fallback": function () {
        "use strict";
        var id = 'rumbletalk';
        tarteaucitron.fallback(['rumbletalk'], function (elem) {
            elem.style.width = tarteaucitron.getElemWidth(elem) + 'px';
            elem.style.height = tarteaucitron.getElemHeight(elem) + 'px';

            return tarteaucitron.engage(id);
        });
    }
};

// shareaholic
tarteaucitron.services.shareaholic = {
    "key": "shareaholic",
    "type": "social",
    "name": "Shareaholic",
    "uri": "https://shareaholic.com/privacy/choices",
    "needConsent": true,
    "cookies": ['__utma', '__utmb', '__utmc', '__utmz', '__utmt_Shareaholic%20Pageviews'],
    "js": function () {
        "use strict";
        if (tarteaucitron.user.shareaholicSiteId === undefined) {
            return;
        }

        tarteaucitron.fallback(['shareaholic-canvas'], '');
        tarteaucitron.addScript('//dsms0mj1bbhn4.cloudfront.net/assets/pub/shareaholic.js', '', function () {
            try {
                Shareaholic.init(tarteaucitron.user.shareaholicSiteId);
            } catch (e) { }
        });
    },
    "fallback": function () {
        "use strict";
        var id = 'shareaholic';
        tarteaucitron.fallback(['shareaholic-canvas'], tarteaucitron.engage(id));
    }
};

// shareasale
tarteaucitron.services.shareasale = {
    "key": "shareasale",
    "type": "ads",
    "name": "ShareASale",
    "uri": "https://www.shareasale.com/PrivacyPolicy.pdf",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";
        var uniqIds = [],
            i,
            uri;

        tarteaucitron.fallback(['shareasale-canvas'], function (x) {
            var uniqId = '_' + Math.random().toString(36).substr(2, 9);
            uniqIds.push(uniqId);
            return '<div id="' + uniqId + '" amount="' + x.getAttribute('amount') + '" tracking="' + x.getAttribute('tracking') + '" transtype="' + x.getAttribute('transtype') + '" persale="' + x.getAttribute('persale') + '" perlead="' + x.getAttribute('perlead') + '" perhit="' + x.getAttribute('perhit') + '" merchantID="' + x.getAttribute('merchantID') + '"></div>';
        });

        for (i = 0; i < uniqIds.length; i += 1) {
            uri = 'https://shareasale.com/sale.cfm?';
            uri += 'amount=' + document.getElementById(uniqIds[i]).getAttribute('amount') + '&';
            uri += 'tracking=' + document.getElementById(uniqIds[i]).getAttribute('tracking') + '&';
            uri += 'transtype=' + document.getElementById(uniqIds[i]).getAttribute('transtype') + '&';
            uri += 'persale=' + document.getElementById(uniqIds[i]).getAttribute('persale') + '&';
            uri += 'perlead=' + document.getElementById(uniqIds[i]).getAttribute('perlead') + '&';
            uri += 'perhit=' + document.getElementById(uniqIds[i]).getAttribute('perhit') + '&';
            uri += 'merchantID=' + document.getElementById(uniqIds[i]).getAttribute('merchantID');

            document.getElementById(uniqIds[i]).innerHTML = '<img src=\'' + uri + '\' width=\'1\' height=\'1\' />';
        }
    },
    "fallback": function () {
        "use strict";
        var id = 'shareasale';
        tarteaucitron.fallback(['shareasale-canvas'], tarteaucitron.engage(id));
    }
};

// sharethis
tarteaucitron.services.sharethis = {
    "key": "sharethis",
    "type": "social",
    "name": "ShareThis",
    "uri": "http://www.sharethis.com/legal/privacy/",
    "needConsent": true,
    "cookies": ['__unam'],
    "js": function () {
        "use strict";
        if (tarteaucitron.user.sharethisPublisher === undefined) {
            return;
        }
        var switchTo5x = true,
            uri = ('https:' === document.location.protocol ? 'https://ws' : 'http://w') + '.sharethis.com/button/buttons.js';

        tarteaucitron.fallback(['tacSharethis'], '');
        tarteaucitron.addScript(uri, '', function () {
            stLight.options({ publisher: tarteaucitron.user.sharethisPublisher, doNotHash: false, doNotCopy: false, hashAddressBar: false });
        });

        if (tarteaucitron.isAjax === true) {
            if (typeof stButtons !== "undefined") {
                stButtons.locateElements();
            }
        }
    },
    "fallback": function () {
        "use strict";
        var id = 'sharethis';
        tarteaucitron.fallback(['tacSharethis'], tarteaucitron.engage(id));
    }
};

// slideshare
tarteaucitron.services.slideshare = {
    "key": "slideshare",
    "type": "video",
    "name": "SlideShare",
    "uri": "https://www.linkedin.com/legal/privacy-policy",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";
        tarteaucitron.fallback(['slideshare-canvas'], function (x) {
            var frame_title = tarteaucitron.fixSelfXSS(x.getAttribute("title") || 'Slideshare iframe'),
                id = x.getAttribute("data-id"),
                width = x.getAttribute("width"),
                height = x.getAttribute("height"),
                url = '//www.slideshare.net/slideshow/embed_code/' + id;

            return '<iframe title="' + frame_title + '" src="' + url + '" width="' + width + '" height="' + height + '" scrolling="no" allowtransparency allowfullscreen></iframe>';
        });
    },
    "fallback": function () {
        "use strict";
        var id = 'slideshare';
        tarteaucitron.fallback(['slideshare-canvas'], function (elem) {
            elem.style.width = elem.getAttribute('width') + 'px';
            elem.style.height = elem.getAttribute('height') + 'px';
            return tarteaucitron.engage(id);
        });
    }
};

// soundcloud
tarteaucitron.services.soundcloud = {
    key: 'soundcloud',
    type: 'video',
    name: 'SoundCloud',
    needConsent: true,
    cookies: ['sc_anonymous_id', 'sclocale'],
    js: function () {
        "use strict";
        tarteaucitron.fallback(['soundcloud_player'], function (x) {
            var frame_title = tarteaucitron.fixSelfXSS(x.getAttribute("title") || 'Soundcloud iframe'),
                player_height = x.getAttribute('data-height'),
                frame_height = 'height="' + player_height + '" ',
                playable_id = x.getAttribute('data-playable-id'),
                playable_type = x.getAttribute('data-playable-type'),
                playable_url = x.getAttribute('data-playable-url'),
                color = x.getAttribute('data-color'),
                autoplay = x.getAttribute('data-auto-play'),
                hideRelated = x.getAttribute('data-hide-related'),
                showComments = x.getAttribute('data-show-comments'),
                showUser = x.getAttribute('data-show-user'),
                showReposts = x.getAttribute('data-show-reposts'),
                showTeaser = x.getAttribute('data-show-teaser'),
                visual = x.getAttribute('data-visual'),
                artwork = x.getAttribute('data-artwork');

            var allowAutoplay = autoplay === 'true' ? 'allow="autoplay"' : '';

            if (playable_id === undefined && playable_url === undefined) {
                return "";
            }

            // Allow to embed from API results (playable_type + playable_id)
            var qs = '?url=https%3A//api.soundcloud.com/' + playable_type + '/' + playable_id;
            // Or from raw URL from Soundcloud website
            if (playable_url && playable_url.length > 0) qs = '?url=' + escape(playable_url);

            if (hideRelated && hideRelated.length > 0) qs += '&hide_related=' + hideRelated;
            if (color && color.length > 0) qs += '&color=' + color.replace('#', '%23');
            if (autoplay && autoplay.length > 0) qs += '&auto_play=' + autoplay;
            if (showComments && showComments.length > 0) qs += '&show_comments=' + showComments;
            if (hideRelated && hideRelated.length > 0) qs += '&hide_related=' + hideRelated;
            if (showUser && showUser.length > 0) qs += '&show_user=' + showUser;
            if (showReposts && showReposts.length > 0) qs += '&show_reposts=' + showReposts;
            if (showTeaser && showTeaser.length > 0) qs += '&show_teaser=' + showTeaser;
            if (visual && visual.length > 0) qs += '&visual=' + visual;
            if (artwork && artwork.length > 0) qs += '&show_artwork=' + artwork;

            return '<iframe title="' + frame_title + '" width="100%" ' + frame_height + ' scrolling="no" ' + allowAutoplay + ' src="https://w.soundcloud.com/player/' + qs + '"></iframe>';
        });
    },
    fallback: function () {
        "use strict";
        tarteaucitron.fallback(['soundcloud_player'], function (elem) {
            elem.style.height = elem.getAttribute('data-height') + 'px';
            return tarteaucitron.engage('soundcloud');
        });
    }
};

// spotify
tarteaucitron.services.spotify = {
    "key": "spotify",
    "type": "video",
    "name": "Spotify",
    "uri": "https://www.spotify.com/us/legal/privacy-policy/",
    "needConsent": true,
    "cookies": ['sp_landing', '_ga', 'sp_ab', 'sp_landingref', 'sp_t', 'sp_usid', 'OptanonConsent', 'sp_m', 'spot'],
    "js": function () {
        "use strict";
        tarteaucitron.fallback(['spotify_player'], function (x) {
            var frame_title = tarteaucitron.fixSelfXSS(x.getAttribute("title") || 'Spotify iframe'),
                spotify_id = x.getAttribute("spotifyID"),
                spotify_width = x.getAttribute("width"),
                frame_width = 'width=',
                spotify_height = x.getAttribute("height"),
                frame_height = 'height=',
                spotify_frame;

            if (spotify_id === undefined) {
                return "";
            }
            if (spotify_width !== undefined) {
                frame_width += '"' + spotify_width + '" ';
            } else {
                frame_width += '"" ';
            }
            if (spotify_height !== undefined) {
                frame_height += '"' + spotify_height + '" ';
            } else {
                frame_height += '"" ';
            }
            spotify_frame = '<iframe title="' + frame_title + '" src="//open.spotify.com/embed/' + spotify_id + '" ' + frame_width + frame_height + ' allowfullscreen></iframe>';
            return spotify_frame;
        });
    },
    "fallback": function () {
        "use strict";
        var id = 'spotify';
        tarteaucitron.fallback(['spotify_player'], function (elem) {
            elem.style.width = elem.getAttribute('width') + 'px';
            elem.style.height = elem.getAttribute('height') + 'px';
            return tarteaucitron.engage(id);
        });
    }
};

// statcounter
tarteaucitron.services.statcounter = {
    "key": "statcounter",
    "type": "analytic",
    "name": "StatCounter",
    "uri": "https://fr.statcounter.com/about/legal/#privacy",
    "needConsent": true,
    "cookies": ['sc_is_visitor_unique'],
    "js": function () {
        "use strict";
        var uniqIds = [],
            i,
            uri = '//statcounter.com/counter/counter.js';

        tarteaucitron.fallback(['statcounter-canvas'], function (x) {
            var uniqId = '_' + Math.random().toString(36).substr(2, 9);
            uniqIds.push(uniqId);
            return '<div id="' + uniqId + '"></div>';
        });

        for (i = 0; i < uniqIds.length; i += 1) {
            tarteaucitron.makeAsync.init(uri, uniqIds[i]);
        }
    },
    "fallback": function () {
        "use strict";
        var id = 'statcounter';
        tarteaucitron.fallback(['statcounter-canvas'], tarteaucitron.engage(id));
    }
};

// timelinejs
tarteaucitron.services.timelinejs = {
    "key": "timelinejs",
    "type": "api",
    "name": "Timeline JS",
    "uri": "http://timeline.knightlab.com/#help",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";
        tarteaucitron.fallback(['timelinejs-canvas'], function (x) {
            var frame_title = tarteaucitron.fixSelfXSS(x.getAttribute("title") || 'Twitter iframe'),
                spreadsheet_id = x.getAttribute("spreadsheet_id"),
                width = x.getAttribute("width"),
                height = x.getAttribute("height"),
                lang = x.getAttribute("lang_2_letter"),
                font = x.getAttribute("font"),
                map = x.getAttribute("map"),
                start_at_end = x.getAttribute("start_at_end"),
                hash_bookmark = x.getAttribute("hash_bookmark"),
                start_at_slide = x.getAttribute("start_at_slide"),
                start_zoom = x.getAttribute("start_zoom"),
                url = '//cdn.knightlab.com/libs/timeline/latest/embed/index.html?source=' + spreadsheet_id + '&font=' + font + '&maptype=' + map + '&lang=' + lang + '&start_at_end=' + start_at_end + '&hash_bookmark=' + hash_bookmark + '&start_at_slide=' + start_at_slide + '&start_zoom_adjust=' + start_zoom + '&height=' + height;

            return '<iframe title="' + frame_title + '" src="' + url + '" width="' + width + '" height="' + height + '" allowtransparency allowfullscreen></iframe>';
        });
    },
    "fallback": function () {
        "use strict";
        var id = 'timelinejs';
        tarteaucitron.fallback(['timelinejs-canvas'], function (elem) {
            elem.style.width = elem.getAttribute('width') + 'px';
            elem.style.height = elem.getAttribute('height') + 'px';
            return tarteaucitron.engage(id);
        });
    }
};

// tagcommander
tarteaucitron.services.tagcommander = {
    "key": "tagcommander",
    "type": "api",
    "name": "TagCommander",
    "uri": "https://www.commandersact.com/en/privacy/",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";
        if (tarteaucitron.user.tagcommanderid === undefined) {
            return;
        }
        tarteaucitron.addScript('https://cdn.tagcommander.com/' + tarteaucitron.user.tagcommanderid + '.js');
    }
};

// typekit
tarteaucitron.services.typekit = {
    "key": "typekit",
    "type": "api",
    "name": "Typekit (adobe)",
    "uri": "https://www.adobe.com/privacy.html",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";
        if (tarteaucitron.user.typekitId === undefined) {
            return;
        }
        tarteaucitron.addScript('//use.typekit.net/' + tarteaucitron.user.typekitId + '.js', '', function () {
            try {
                Typekit.load();
            } catch (e) { }
        });
    }
};

// twenga
tarteaucitron.services.twenga = {
    "key": "twenga",
    "type": "ads",
    "name": "Twenga",
    "uri": "http://www.twenga.com/privacy.php",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";

        if (tarteaucitron.user.twengaId === undefined || tarteaucitron.user.twengaLocale === undefined) {
            return;
        }

        tarteaucitron.addScript('//tracker.twenga.' + tarteaucitron.user.twengaLocale + '/st/tracker_' + tarteaucitron.user.twengaId + '.js');
    }
};

// twitter
tarteaucitron.services.twitter = {
    "key": "twitter",
    "type": "social",
    "name": "Twitter",
    "uri": "https://support.twitter.com/articles/20170514",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";
        tarteaucitron.fallback(['tacTwitter'], '');
        tarteaucitron.addScript('//platform.twitter.com/widgets.js', 'twitter-wjs');
    },
    "fallback": function () {
        "use strict";
        var id = 'twitter';
        tarteaucitron.fallback(['tacTwitter'], tarteaucitron.engage(id));
    }
};

// twitter embed
tarteaucitron.services.twitterembed = {
    "key": "twitterembed",
    "type": "social",
    "name": "Twitter (cards)",
    "uri": "https://support.twitter.com/articles/20170514",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";
        var uniqIds = [],
            i,
            e,
            html;

        tarteaucitron.fallback(['twitterembed-canvas'], function (x) {
            var uniqId = '_' + Math.random().toString(36).substr(2, 9);
            uniqIds.push(uniqId);
            html = '<div id="' + uniqId + '" ';
            html += 'tweetid="' + x.getAttribute('tweetid') + '" ';
            html += 'theme="' + x.getAttribute('theme') + '" ';
            html += 'cards="' + x.getAttribute('cards') + '" ';
            html += 'conversation="' + x.getAttribute('conversation') + '" ';
            html += 'data-width="' + x.getAttribute('data-width') + '" ';
            html += 'data-align="' + x.getAttribute('data-align') + '" ';
            html += '></div>';
            return html;
        });

        tarteaucitron.addScript('//platform.twitter.com/widgets.js', 'twitter-wjs', function () {
            var i;
            for (i = 0; i < uniqIds.length; i += 1) {
                e = document.getElementById(uniqIds[i]);
                twttr.widgets.createTweet(
                    e.getAttribute('tweetid'),
                    e,
                    {
                        theme: e.getAttribute('theme'),
                        cards: e.getAttribute('cards'),
                        conversation: e.getAttribute('conversation'),
                        lang: tarteaucitron.getLanguage(),
                        dnt: true,
                        width: e.getAttribute('data-width'),
                        align: e.getAttribute('data-align')
                    }
                );
            }
        });
    },
    "fallback": function () {
        "use strict";
        var id = 'twitterembed';
        tarteaucitron.fallback(['twitterembed-canvas'], function (elem) {
            elem.style.width = elem.getAttribute('data-width') + 'px';
            return tarteaucitron.engage(id);
        });
    }
};

// twitter timeline
tarteaucitron.services.twittertimeline = {
    "key": "twittertimeline",
    "type": "social",
    "name": "Twitter (timelines)",
    "uri": "https://support.twitter.com/articles/20170514",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";
        tarteaucitron.fallback(['tacTwitterTimelines'], '');
        tarteaucitron.addScript('//platform.twitter.com/widgets.js', 'twitter-wjs');
    },
    "fallback": function () {
        "use strict";
        var id = 'twittertimeline';
        tarteaucitron.fallback(['tacTwitterTimelines'], tarteaucitron.engage(id));
    }
};

// twitter universal website tag
tarteaucitron.services.twitteruwt = {
    "key": "twitteruwt",
    "type": "analytic",
    "name": "Twitter Universal Website Tag",
    "uri": "https://business.twitter.com/en/help/campaign-measurement-and-analytics/conversion-tracking-for-websites.html",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";

        window.twq = function () {
            window.twq.exe ? window.twq.exe.apply(window.twq, arguments) : window.twq.queue.push(arguments);
        }
        window.twq.version = '1.1';
        window.twq.queue = [];

        tarteaucitron.addScript('https://static.ads-twitter.com/uwt.js', '', function () {
            window.twq('init', tarteaucitron.user.twitteruwtId);
            window.twq('track', 'PageView');
        });
    }
};

// user voice
tarteaucitron.services.uservoice = {
    "key": "uservoice",
    "type": "support",
    "name": "UserVoice",
    "uri": "https://www.uservoice.com/privacy/",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";
        if (tarteaucitron.user.userVoiceApi === undefined) {
            return;
        }
        tarteaucitron.addScript('//widget.uservoice.com/' + tarteaucitron.user.userVoiceApi + '.js');
    }
};

// vimeo
tarteaucitron.services.vimeo = {
    "key": "vimeo",
    "type": "video",
    "name": "Vimeo",
    "uri": "https://vimeo.com/privacy",
    "needConsent": true,
    "cookies": ['__utmt_player', '__utma', '__utmb', '__utmc', '__utmv', 'vuid', '__utmz', 'player'],
    "js": function () {
        "use strict";
        tarteaucitron.fallback(['vimeo_player'], function (x) {
            var frame_title = tarteaucitron.fixSelfXSS(tarteaucitron.getElemAttr(x, "title") || 'Vimeo iframe'),
                video_width = tarteaucitron.getElemAttr(x, "width"),
                frame_width = 'width=',
                video_height = tarteaucitron.getElemAttr(x, "height"),
                frame_height = 'height=',

                video_id = tarteaucitron.getElemAttr(x, "videoID"),
                video_hash = tarteaucitron.getElemAttr(x, "data-hash") || '',
                video_allowfullscreen = tarteaucitron.getElemAttr(x, "data-allowfullscreen"),

                video_qs = "",
                attrs = ["title", "byline", "portrait", "loop", "autoplay", "autopause", "background", "color", "controls", "maxheight", "maxwidth", "muted", "playsinline", "speed", "transparent"],
                params = attrs.filter(function (a) {
                    return tarteaucitron.getElemAttr(x, a) !== null;
                }).map(function (a) {
                    return a + "=" + tarteaucitron.getElemAttr(x, a);
                }),

                video_frame;

            if (video_id === undefined) {
                return "";
            }

            // query params
            if (video_hash.length > 0) {
                params.push("h=" + video_hash);
            }
            if (params.length > 0) {
                video_qs = "?" + params.join("&");
            }

            // attributes
            if (video_width !== undefined) {
                frame_width += '"' + video_width + '" ';
            } else {
                frame_width += '"" ';
            }
            if (video_height !== undefined) {
                frame_height += '"' + video_height + '" ';
            } else {
                frame_height += '"" ';
            }

            video_frame = '<iframe title="' + frame_title + '" src="//player.vimeo.com/video/' + video_id + video_qs + '" ' + frame_width + frame_height + (video_allowfullscreen == '0' ? '' : ' webkitallowfullscreen mozallowfullscreen allowfullscreen') + '></iframe>';

            return video_frame;
        });
    },
    "fallback": function () {
        "use strict";
        var id = 'vimeo';
        tarteaucitron.fallback(['vimeo_player'], function (elem) {
            elem.style.width = elem.getAttribute('width') + 'px';
            elem.style.height = elem.getAttribute('height') + 'px';
            return tarteaucitron.engage(id);
        });
    }
};

// visualrevenue
tarteaucitron.services.visualrevenue = {
    "key": "visualrevenue",
    "type": "analytic",
    "name": "VisualRevenue",
    "uri": "http://www.outbrain.com/legal/privacy-713/",
    "needConsent": true,
    "cookies": ['__vrf', '__vrm', '__vrl', '__vry', '__vru', '__vrid', '__vrz'],
    "js": function () {
        "use strict";
        if (tarteaucitron.user.visualrevenueId === undefined) {
            return;
        }
        window._vrq = window._vrq || [];
        window._vrq.push(['id', tarteaucitron.user.visualrevenueId]);
        window._vrq.push(['automate', true]);
        window._vrq.push(['track', function () { }]);
        tarteaucitron.addScript('http://a.visualrevenue.com/vrs.js');
    }
};

// verizon dot tag
tarteaucitron.services.verizondottag = {
    "key": "verizondottag",
    "type": "analytic",
    "name": "Verizon Dot Tag",
    "uri": "https://developer.verizonmedia.com/native/guide/audience-management/dottags/",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";

        window.dotq = window.dotq || [];
        window.dotq.push({
            'projectId': tarteaucitron.user.verizondottagProjectId,
            'properties': { 'pixelId': tarteaucitron.user.verizondottagPixelId }
        });

        tarteaucitron.addScript('https://s.yimg.com/wi/ytc.js', '', function () {
            //const items = window.dotq;
            window.dotq = [];
            window.dotq.push = function (item) {
                YAHOO.ywa.I13N.fireBeacon([item])
            };
            YAHOO.ywa.I13N.fireBeacon(items)
        });
    }
};

// vshop
tarteaucitron.services.vshop = {
    "key": "vshop",
    "type": "ads",
    "name": "vShop",
    "uri": "http://vshop.fr/privacy-policy",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";
        tarteaucitron.fallback(['vcashW'], '');
        tarteaucitron.addScript('//vshop.fr/js/w.js');
    },
    "fallback": function () {
        "use strict";
        var id = 'vshop';
        tarteaucitron.fallback(['vcashW'], tarteaucitron.engage(id));
    }
};

// wysistat
tarteaucitron.services.wysistat = {
    "key": "wysistat",
    "type": "analytic",
    "name": "Wysistat",
    "uri": "http://wysistat.net/contact/",
    "needConsent": true,
    "cookies": ['Wysistat'],
    "js": function () {
        "use strict";
        if (tarteaucitron.user.wysistat === undefined) {
            return;
        }
        tarteaucitron.addScript('//www.wysistat.com/statistique.js', '', function () {
            window.stat(tarteaucitron.user.wysistat.cli, tarteaucitron.user.wysistat.frm, tarteaucitron.user.wysistat.prm, tarteaucitron.user.wysistat.ce, tarteaucitron.user.wysistat.page, tarteaucitron.user.wysistat.roi, tarteaucitron.user.wysistat.prof, tarteaucitron.user.wysistat.cpt);
        });
    }
};

// xiti
tarteaucitron.services.xiti = {
    "key": "xiti",
    "type": "analytic",
    "name": "Xiti",
    "uri": "https://www.atinternet.com/rgpd-et-vie-privee/",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";
        if (tarteaucitron.user.xitiId === undefined) {
            return;
        }
        var Xt_param = 's=' + tarteaucitron.user.xitiId + '&p=',
            Xt_r,
            Xt_h,
            Xt_i,
            Xt_s,
            div = document.createElement('div');
        try {
            Xt_r = top.document.referrer;
        } catch (e) {
            Xt_r = document.referrer;
        }
        Xt_h = new Date();
        Xt_i = '<img style="display:none" border="0" alt="" ';
        Xt_i += 'src="http://logv3.xiti.com/hit.xiti?' + Xt_param;
        Xt_i += '&hl=' + Xt_h.getHours() + 'x' + Xt_h.getMinutes() + 'x' + Xt_h.getSeconds();
        if (parseFloat(navigator.appVersion) >= 4) {
            Xt_s = screen;
            Xt_i += '&r=' + Xt_s.width + 'x' + Xt_s.height + 'x' + Xt_s.pixelDepth + 'x' + Xt_s.colorDepth;
        }

        div.innerHTML = Xt_i + '&ref=' + Xt_r.replace(/[<>"]/g, '').replace(/&/g, '$') + '" title="Internet Audience">';
        document.getElementsByTagName('body')[0].appendChild(div.firstChild);

        if (typeof tarteaucitron.user.xitiMore === 'function') {
            tarteaucitron.user.xitiMore();
        }
    }
};

// AT Internet
tarteaucitron.services.atinternet = {
    "key": "atinternet",
    "type": "analytic",
    "name": "AT Internet (privacy by design)",
    "uri": "https://www.atinternet.com/rgpd-et-vie-privee/",
    "needConsent": true,
    "safeanalytic": false,
    "cookies": ['atidvisitor', 'atreman', 'atredir', 'atsession'],
    "js": function () {
        "use strict";
        if (tarteaucitron.user.atLibUrl === undefined) {
            return;
        }

        if (tarteaucitron.user.atinternetAlreadyLoaded !== undefined) {
            return;
        }

        tarteaucitron.addScript(tarteaucitron.user.atLibUrl, '', function () {

            window.tag = new ATInternet.Tracker.Tag();

            if (typeof window.tag.privacy !== 'undefined') {
                window.tag.privacy.setVisitorOptin();
            }

            if (typeof tarteaucitron.user.atMore === 'function') {
                tarteaucitron.user.atMore();
            }

            if (tarteaucitron.user.atinternetSendData !== false) {
                window.tag.page.send();
            }
        });
    },
    "fallback": function () {
        "use strict";
        if (tarteaucitron.user.atLibUrl === undefined) {
            return;
        }

        if (tarteaucitron.user.atNoFallback === true) {
            return;
        }

        tarteaucitron.user.atinternetAlreadyLoaded = true;

        tarteaucitron.addScript(tarteaucitron.user.atLibUrl, '', function () {

            window.tag = new ATInternet.Tracker.Tag();

            if (typeof window.tag.privacy !== 'undefined') {

                var visitorMode = window.tag.privacy.getVisitorMode();
                if (visitorMode !== null && visitorMode.name !== undefined && visitorMode.name == "optout") {
                    window.tag.privacy.setVisitorOptout();
                } else {
                    window.tag.privacy.setVisitorMode('cnil', 'exempt');
                }
            }

            if (typeof tarteaucitron.user.atMore === 'function') {
                tarteaucitron.user.atMore();
            }

            if (tarteaucitron.user.atinternetSendData !== false) {
                window.tag.page.send();
            }
        });
    }
};

// AT Internet
tarteaucitron.services.atinternethightrack = {
    "key": "atinternethightrack",
    "type": "analytic",
    "name": "AT Internet",
    "uri": "https://www.atinternet.com/rgpd-et-vie-privee/",
    "needConsent": true,
    "cookies": ['atidvisitor', 'atreman', 'atredir', 'atsession'],
    "js": function () {
        "use strict";
        if (tarteaucitron.user.atLibUrl === undefined) {
            return;
        }

        tarteaucitron.addScript(tarteaucitron.user.atLibUrl, '', function () {

            var tag = new ATInternet.Tracker.Tag();

            if (typeof tarteaucitron.user.atMore === 'function') {
                tarteaucitron.user.atMore();
            }
        })
    }
};

// youtube
tarteaucitron.services.youtube = {
    "key": "youtube",
    "type": "video",
    "name": "YouTube",
    "uri": "https://policies.google.com/privacy",
    "needConsent": true,
    "cookies": ['VISITOR_INFO1_LIVE', 'YSC', 'PREF', 'GEUP'],
    "js": function () {
        "use strict";
        tarteaucitron.fallback(['youtube_player'], function (x) {
            var frame_title = tarteaucitron.fixSelfXSS(tarteaucitron.getElemAttr(x, "title") || 'Youtube iframe'),
                video_id = tarteaucitron.getElemAttr(x, "videoID"),
                srcdoc = tarteaucitron.getElemAttr(x, "srcdoc"),
                loading = tarteaucitron.getElemAttr(x, "loading"),
                video_width = tarteaucitron.getElemAttr(x, "width"),
                frame_width = 'width=',
                video_height = tarteaucitron.getElemAttr(x, "height"),
                frame_height = 'height=',
                video_frame,
                allowfullscreen = tarteaucitron.getElemAttr(x, "allowfullscreen"),
                attrs = ["theme", "rel", "controls", "showinfo", "autoplay", "mute", "start", "loop", "enablejsapi"],
                params = attrs.filter(function (a) {
                    return tarteaucitron.getElemAttr(x, a) !== null;
                }).map(function (a) {
                    return a + "=" + tarteaucitron.getElemAttr(x, a);
               }).join("&");

            if(tarteaucitron.getElemAttr(x, "loop") == 1) {
               params = params + "&playlist=" + video_id;
            }

            if (video_id === undefined) {
                return "";
            }
            if (video_width !== undefined) {
                frame_width += '"' + video_width + '" ';
            } else {
                frame_width += '"" ';
            }
            if (video_height !== undefined) {
                frame_height += '"' + video_height + '" ';
            } else {
                frame_height += '"" ';
            }

            if (srcdoc !== undefined && srcdoc !== null && srcdoc !== "") {
                srcdoc = 'srcdoc="' + srcdoc + '" ';
            } else {
                srcdoc = '';
            }

            if (loading !== undefined && loading !== null && loading !== "") {
                loading = 'loading ';
            } else {
                loading = '';
            }

            video_frame = '<iframe title="' + frame_title + '" type="text/html" ' + frame_width + frame_height + ' src="//www.youtube-nocookie.com/embed/' + video_id + '?' + params + '"' + (allowfullscreen == '0' ? '' : ' webkitallowfullscreen mozallowfullscreen allowfullscreen') + ' ' + srcdoc + ' ' + loading + '></iframe>';
            return video_frame;
        });
    },
    "fallback": function () {
        "use strict";
        var id = 'youtube';
        tarteaucitron.fallback(['youtube_player'], function (elem) {
            elem.style.width = elem.getAttribute('width') + 'px';
            elem.style.height = elem.getAttribute('height') + 'px';
            return tarteaucitron.engage(id);
        });
    }
};

// youtube playlist
tarteaucitron.services.youtubeplaylist = {
    "key": "youtubeplaylist",
    "type": "video",
    "name": "YouTube (playlist)",
    "uri": "https://policies.google.com/privacy",
    "needConsent": true,
    "cookies": ['VISITOR_INFO1_LIVE', 'YSC', 'PREF', 'GEUP'],
    "js": function () {
        "use strict";
        tarteaucitron.fallback(['youtube_playlist_player'], function (x) {
            var frame_title = tarteaucitron.fixSelfXSS(tarteaucitron.getElemAttr(x, "title") || 'Youtube iframe'),
                playlist_id = tarteaucitron.getElemAttr(x, "playlistID"),
                video_width = tarteaucitron.getElemAttr(x, "width"),
                frame_width = 'width=',
                video_height = tarteaucitron.getElemAttr(x, "height"),
                frame_height = 'height=',
                video_frame,
                allowfullscreen = tarteaucitron.getElemAttr(x, "allowfullscreen"),
                params = 'theme=' + tarteaucitron.getElemAttr(x, "theme") + '&rel=' + tarteaucitron.getElemAttr(x, "rel") + '&controls=' + tarteaucitron.getElemAttr(x, "controls") + '&showinfo=' + tarteaucitron.getElemAttr(x, "showinfo") + '&autoplay=' + tarteaucitron.getElemAttr(x, "autoplay") + '&mute=' + tarteaucitron.getElemAttr(x, "mute");

            if (playlist_id === undefined) {
                return "";
            }
            if (video_width !== undefined) {
                frame_width += '"' + video_width + '" ';
            } else {
                frame_width += '"" ';
            }
            if (video_height !== undefined) {
                frame_height += '"' + video_height + '" ';
            } else {
                frame_height += '"" ';
            }
            video_frame = '<iframe title="' + frame_title + '" type="text/html" ' + frame_width + frame_height + ' src="//www.youtube-nocookie.com/embed/videoseries?list=' + playlist_id + '&' + params + '"' + (allowfullscreen == '0' ? '' : ' webkitallowfullscreen mozallowfullscreen allowfullscreen') + '></iframe>';
            return video_frame;
        });
    },
    "fallback": function () {
        "use strict";
        var id = 'youtubeplaylist';
        tarteaucitron.fallback(['youtube_playlist_player'], function (elem) {
            elem.style.width = elem.getAttribute('width') + 'px';
            elem.style.height = elem.getAttribute('height') + 'px';
            return tarteaucitron.engage(id);
        });
    }
};

// zopim
tarteaucitron.services.zopim = {
    "key": "zopim",
    "type": "support",
    "name": "Zopim",
    "uri": "https://www.zopim.com/privacy",
    "needConsent": true,
    "cookies": ['__zlcid', '__zprivacy'],
    "js": function () {
        "use strict";
        if (tarteaucitron.user.zopimID === undefined) {
            return;
        }
        tarteaucitron.addScript('//v2.zopim.com/?' + tarteaucitron.user.zopimID);
    }
};

// kameleoon
tarteaucitron.services.kameleoon = {
    "key": "kameleoon",
    "type": "analytic",
    "name": "Kameleoon",
    "uri": "https://www.kameleoon.com/fr/compliance/rgpd",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";
        if (tarteaucitron.user.kameleoon !== undefined) {
            tarteaucitron.addScript("https://" + tarteaucitron.user.kameleoon + ".kameleoon.eu/kameleoon.js");
        }
    }
};

// linkedin insight
tarteaucitron.services.linkedininsighttag = {
    "key": "linkedininsighttag",
    "type": "ads",
    "name": "Linkedin Insight",
    "uri": "https://www.linkedin.com/legal/cookie_policy",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";
        if (tarteaucitron.user.linkedininsighttag !== undefined) {
            window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
            window._linkedin_data_partner_ids.push(tarteaucitron.user.linkedininsighttag);
        }

        tarteaucitron.addScript('https://snap.licdn.com/li.lms-analytics/insight.min.js');
    }
};

// xiti smartTag
tarteaucitron.services.xiti_smarttag = {
    "key": "xiti_smarttag",
    "type": "analytic",
    "name": "Xiti (SmartTag)",
    "uri": "https://www.atinternet.com/rgpd-et-vie-privee/",
    "needConsent": true,
    "cookies": ["atidvisitor", "atreman", "atredir", "atsession", "attvtreman", "attvtsession"],
    "js": function () {
        "use strict";
        if (tarteaucitron.user.xiti_smarttagLocalPath !== undefined) {
            tarteaucitron.addScript(tarteaucitron.user.xiti_smarttagLocalPath, 'smarttag', null, null, "onload", "addTracker();");
        } else {
            var xitiSmarttagId = tarteaucitron.user.xiti_smarttagSiteId;
            if (xitiSmarttagId === undefined) {
                return;
            }

            tarteaucitron.addScript('//tag.aticdn.net/' + xitiSmarttagId + '/smarttag.js', 'smarttag', null, null, "onload", "addTracker();");
        }
    }
};

// facebook pixel
tarteaucitron.services.facebookpixel = {
    "key": "facebookpixel",
    "type": "ads",
    "name": "Facebook Pixel",
    "uri": "https://www.facebook.com/policy.php",
    "needConsent": true,
    "cookies": ['datr', 'fr', 'reg_ext_ref', 'reg_fb_gate', 'reg_fb_ref', 'sb', 'wd', 'x-src', '_fbp'],
    "js": function () {
        "use strict";
        var n;
        if (window.fbq) return;
        n = window.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments) };
        if (!window._fbq) window._fbq = n;
        n.push = n;
        n.loaded = !0;
        n.version = '2.0';
        n.queue = [];
        tarteaucitron.addScript('https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', tarteaucitron.user.facebookpixelId);
        fbq('track', 'PageView');

        if (typeof tarteaucitron.user.facebookpixelMore === 'function') {
            tarteaucitron.user.facebookpixelMore();
        }
    }
};

//Issuu
tarteaucitron.services.issuu = {
    "key": "issuu",
    "type": "other",
    "name": "Issuu",
    "uri": "https://issuu.com/legal/privacy",
    "needConsent": true,
    "cookies": ['__qca', 'iutk', 'mc'],
    "js": function () {
        "use strict";
        tarteaucitron.fallback(['issuu_player'], function (x) {
            var frame_title = tarteaucitron.fixSelfXSS(x.getAttribute("title") || 'Issuu iframe'),
                issuu_id = x.getAttribute("issuuID"),
                issuu_width = x.getAttribute("width"),
                frame_width = 'width=',
                issuu_height = x.getAttribute("height"),
                frame_height = 'height=',
                issuu_frame,
                issuu_embed;

            if (issuu_id === undefined) {
                return "";
            }
            if (issuu_width !== undefined) {
                frame_width += '"' + issuu_width + '" ';
            } else {
                frame_width += '"" ';
            }
            if (issuu_height !== undefined) {
                frame_height += '"' + issuu_height + '" ';
            } else {
                frame_height += '"" ';
            }


            if (issuu_id.match(/\d+\/\d+/)) { issuu_embed = '#' + issuu_id; } else if (issuu_id.match(/d=(.*)&u=(.*)/)) { issuu_embed = '?' + issuu_id; }


            issuu_frame = '<iframe title="' + frame_title + '" type="text/html" ' + frame_width + frame_height + ' src="//e.issuu.com/embed.html' + issuu_embed + '"></iframe>';

            return issuu_frame;
        });
    },
    "fallback": function () {
        "use strict";
        var id = 'issuu';
        tarteaucitron.fallback(['issuu_player'], function (elem) {
            elem.style.width = elem.getAttribute('width') + 'px';
            elem.style.height = elem.getAttribute('height') + 'px';
            return tarteaucitron.engage(id);
        });
    }
};

// webmecanik
tarteaucitron.services.webmecanik = {
    "key": "webmecanik",
    "type": "analytic",
    "name": "Webmecanik",
    "uri": "https://webmecanik.com/tos",
    "needConsent": true,
    "cookies": ['mtc_id', 'mtc_sid'],
    "js": function () {
        "use strict";
        if (tarteaucitron.user.webmecanikurl === undefined) {
            return;
        }

        window.MauticTrackingObject = 'mt';
        window.mt = window.mt || function () {
            window.mt.q = window.mt.q || [];
            window.mt.q.push(arguments);
        };

        tarteaucitron.addScript(tarteaucitron.user.webmecanikurl, '', function () {
            mt('send', 'pageview');
        });
    }
};

// google analytics multiple
tarteaucitron.services.multiplegtag = {
    "key": "multiplegtag",
    "type": "analytic",
    "name": "Google Analytics (gtag.js)",
    "uri": "https://support.google.com/analytics/answer/6004245",
    "needConsent": true,
    "cookies": (function () {

        var cookies = ['_ga', '_gat', '_gid', '__utma', '__utmb', '__utmc', '__utmt', '__utmz', '_gcl_au'];

        if (tarteaucitron.user.multiplegtagUa !== undefined) {
            tarteaucitron.user.multiplegtagUa.forEach(function (ua) {
                cookies.push('_gat_gtag_' + ua.replace(/-/g, '_'));
                cookies.push('_ga_' + ua.replace(/G-/g, ''));
            });
        }

        return cookies;
    })(),
    "js": function () {
        "use strict";
        window.dataLayer = window.dataLayer || [];

        if (tarteaucitron.user.multiplegtagUa !== undefined) {
            tarteaucitron.user.multiplegtagUa.forEach(function (ua) {
                tarteaucitron.addScript('https://www.googletagmanager.com/gtag/js?id=' + ua, '', function () {
                    window.gtag = function gtag() { dataLayer.push(arguments); }
                    gtag('js', new Date());
                    var additional_config_info = (timeExpire !== undefined) ? {'anonymize_ip': true, 'cookie_expires': timeExpire / 1000} : {'anonymize_ip': true};
                    gtag('config', ua, additional_config_info);
                });
            });
        }
    }
};

// Koban
tarteaucitron.services.koban = {
    "key": "koban",
    "type": "analytic",
    "name": "Koban",
    "uri": "https://koban.cloud/tos",
    "needConsent": true,
    "cookies": ['kbntrk'],
    "js": function () {
        "use strict";
        if (tarteaucitron.user.kobanurl === undefined) {
            return;
        }
        if (tarteaucitron.user.kobanapi === undefined) {
            return;
        }
        window.KobanObject = 'kb';
        window.kb = window.kb || function () {
            window.kb.q = window.kb.q || [];
            window.kb.q.push(arguments);
        };
        window.kb.l = new Date();
        kb('reg', tarteaucitron.user.kobanapi);
        tarteaucitron.addScript(tarteaucitron.user.kobanurl, '', function () {
        });
    }
};

// matomo

/*
    1. Set the following variable before the initialization :

    tarteaucitron.user.matomoId = YOUR_SITE_ID_FROM_MATOMO;
    tarteaucitron.user.matomoHost = "YOUR_MATOMO_URL"; //eg: https://stat.mydomain.com/

    2. Push the service :

    (tarteaucitron.job = tarteaucitron.job || []).push('matomo');  // (or 'matomocloud' for cloud version)

    3. HTML
    You don't need to add any html code, if the service is authorized, the javascript is added. otherwise no.
 */
tarteaucitron.services.matomo = {
    "key": "matomo",
    "type": "analytic",
    "name": "Matomo (privacy by design)",
    "uri": "https://matomo.org/faq/general/faq_146/",
    "needConsent": false,
    "cookies": ['_pk_ref', '_pk_cvar', '_pk_id', '_pk_ses', '_pk_hsr', 'piwik_ignore', '_pk_uid'],
    "js": function () {
        "use strict";
        if (tarteaucitron.user.matomoId === undefined) {
            return;
        }

        window._paq = window._paq || [];
        window._paq.push(["setSiteId", tarteaucitron.user.matomoId]);
        window._paq.push(["setTrackerUrl", tarteaucitron.user.matomoHost + "piwik.php"]);
        window._paq.push(["setDoNotTrack", 1]);
        window._paq.push(["trackPageView"]);
        window._paq.push(["setIgnoreClasses", ["no-tracking", "colorbox"]]);
        window._paq.push(["enableLinkTracking"]);
        window._paq.push([function () {
            var self = this;
            function getOriginalVisitorCookieTimeout() {
                var now = new Date(),
                    nowTs = Math.round(now.getTime() / 1000),
                    visitorInfo = self.getVisitorInfo();
                var createTs = parseInt(visitorInfo[2]);
                var cookieTimeout = 33696000; // 13 mois en secondes
                var originalTimeout = createTs + cookieTimeout - nowTs;
                return originalTimeout;
            }
            this.setVisitorCookieTimeout(getOriginalVisitorCookieTimeout());
        }]);

        tarteaucitron.addScript(tarteaucitron.user.matomoHost + 'piwik.js', '', '', true, 'defer', true);

        // waiting for piwik to be ready to check first party cookies
        var interval = setInterval(function () {
            if (typeof Piwik === 'undefined') return

            clearInterval(interval)

            // make piwik/matomo cookie accessible by getting tracker
            Piwik.getTracker();

            // looping throught cookies
            var theCookies = document.cookie.split(';');
            for (var i = 1; i <= theCookies.length; i++) {
                var cookie = theCookies[i - 1].split('=');
                var cookieName = cookie[0].trim();

                // if cookie starts like a piwik one, register it
                if (cookieName.indexOf('_pk_') === 0) {
                    tarteaucitron.services.matomo.cookies.push(cookieName);
                }
            }
        }, 100)
    }
};


tarteaucitron.services.matomohightrack = {
    "key": "matomohightrack",
    "type": "analytic",
    "name": "Matomo",
    "uri": "https://matomo.org/faq/general/faq_146/",
    "needConsent": false,
    "cookies": ['_pk_ref', '_pk_cvar', '_pk_id', '_pk_ses', '_pk_hsr', 'piwik_ignore', '_pk_uid'],
    "js": function () {
        "use strict";
        if (tarteaucitron.user.matomoId === undefined) {
            return;
        }

        window._paq = window._paq || [];
        window._paq.push(["setSiteId", tarteaucitron.user.matomoId]);
        window._paq.push(["setTrackerUrl", tarteaucitron.user.matomoHost + "piwik.php"]);
        window._paq.push(["trackPageView"]);
        window._paq.push(["setIgnoreClasses", ["no-tracking", "colorbox"]]);
        window._paq.push(["enableLinkTracking"]);
        window._paq.push([function () {
            var self = this;
        }]);

        tarteaucitron.addScript(tarteaucitron.user.matomoHost + 'piwik.js', '', '', true, 'defer', true);

        // waiting for piwik to be ready to check first party cookies
        var interval = setInterval(function () {
            if (typeof Piwik === 'undefined') return

            clearInterval(interval)
            Piwik.getTracker();

            var theCookies = document.cookie.split(';');
            for (var i = 1; i <= theCookies.length; i++) {
                var cookie = theCookies[i - 1].split('=');
                var cookieName = cookie[0].trim();

                if (cookieName.indexOf('_pk_') === 0) {
                    tarteaucitron.services.matomo.cookies.push(cookieName);
                }
            }
        }, 100)
    }
};


tarteaucitron.services.matomocloud = {
    "key": "matomocloud",
    "type": "analytic",
    "name": "Matomo Cloud (privacy by design)",
    "uri": "https://matomo.org/faq/general/faq_146/",
    "needConsent": false,
    "cookies": ['_pk_ref', '_pk_cvar', '_pk_id', '_pk_ses', '_pk_hsr', 'mtm_consent', 'matomo_ignore', 'matomo_sessid'],
    "js": function () {
        "use strict";
        if (tarteaucitron.user.matomoId === undefined) {
            return;
        }

        window._paq = window._paq || [];
        window._paq.push(["setSiteId", tarteaucitron.user.matomoId]);
        window._paq.push(["setTrackerUrl", tarteaucitron.user.matomoHost + "matomo.php"]);
        window._paq.push(["setDoNotTrack", 1]);
        window._paq.push(["trackPageView"]);
        window._paq.push(["setIgnoreClasses", ["no-tracking", "colorbox"]]);
        window._paq.push(["enableLinkTracking"]);
        window._paq.push([function () {
            var self = this;
            function getOriginalVisitorCookieTimeout() {
                var now = new Date(),
                    nowTs = Math.round(now.getTime() / 1000),
                    visitorInfo = self.getVisitorInfo();
                var createTs = parseInt(visitorInfo[2]);
                var cookieTimeout = 33696000; // 13 mois en secondes
                var originalTimeout = createTs + cookieTimeout - nowTs;
                return originalTimeout;
            }
            this.setVisitorCookieTimeout(getOriginalVisitorCookieTimeout());
        }]);

        if (tarteaucitron.user.matomoCustomJSPath === undefined) {
            tarteaucitron.addScript('https://cdn.matomo.cloud/matomo.js', '', '', true, 'defer', true);
        } else {
            tarteaucitron.addScript(tarteaucitron.user.matomoCustomJSPath, '', '', true, 'defer', true);
        }

        // waiting for Matomo to be ready to check first party cookies
        var interval = setInterval(function () {
            if (typeof Matomo === 'undefined') return

            clearInterval(interval)

            // make Matomo cookie accessible by getting tracker
            Matomo.getTracker();

            // looping through cookies
            var theCookies = document.cookie.split(';');
            for (var i = 1; i <= theCookies.length; i++) {
                var cookie = theCookies[i - 1].split('=');
                var cookieName = cookie[0].trim();

                // if cookie starts like a matomo one, register it
                if (cookieName.indexOf('_pk_') === 0) {
                    tarteaucitron.services.matomo.cookies.push(cookieName);
                }
            }
        }, 100)
    }
};

// matomotm
tarteaucitron.services.matomotm = {
    "key": "matomotm",
    "type": "api",
    "name": "Matomo Tag Manager",
    "uri": "https://matomo.org/privacy/",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";
        if (tarteaucitron.user.matomotmUrl === undefined) {
            return;
        }

        var _mtm = window._mtm = window._mtm || [];
        _mtm.push({'mtm.startTime': (new Date().getTime()), 'event': 'mtm.Start'});

        tarteaucitron.addScript(tarteaucitron.user.matomotmUrl);
    }
};


// Hotjar
/*
   1. Set the following variable before the initialization :
    tarteaucitron.user.hotjarId = YOUR_WEBSITE_ID;
   tarteaucitron.user.HotjarSv = XXXX; // Can be found in your website tracking code as "hjvs=XXXX"
    2. Push the service :
    (tarteaucitron.job = tarteaucitron.job || []).push('hotjar');
    3. HTML
   You don't need to add any html code, if the service is autorized, the javascript is added. otherwise no.
 */
tarteaucitron.services.hotjar = {
    "key": "hotjar",
    "type": "analytic",
    "name": "Hotjar",
    "uri": "https://help.hotjar.com/hc/en-us/categories/115001323967-About-Hotjar",
    "needConsent": true,
    "cookies": ["hjClosedSurveyInvites", "_hjDonePolls", "_hjMinimizedPolls", "_hjDoneTestersWidgets", "_hjMinimizedTestersWidgets", "_hjDoneSurveys", "_hjIncludedInSample", "_hjShownFeedbackMessage", "_hjAbsoluteSessionInProgress", "_hjIncludeInPageviewSample", "_hjid"],
    "js": function () {
        "use strict";
        if (tarteaucitron.user.hotjarId === undefined || tarteaucitron.user.HotjarSv === undefined) {
            return;
        }
        window.hj = window.hj || function () {
            (window.hj.q = window.hj.q || []).push(arguments)
        };
        window._hjSettings = {
            hjid: tarteaucitron.user.hotjarId,
            hjsv: tarteaucitron.user.HotjarSv
        };
        var uri = 'https://static.hotjar.com/c/hotjar-';
        var extension = '.js?sv=';
        tarteaucitron.addScript(uri + window._hjSettings.hjid + extension + window._hjSettings.hjsv);
    }
};

// bing ads universal event tracking
tarteaucitron.services.bingads = {
    'key': 'bingads',
    'type': 'ads',
    'name': 'Bing Ads Universal Event Tracking',
    'uri': 'https://advertise.bingads.microsoft.com/en-us/resources/policies/personalized-ads',
    'needConsent': true,
    'cookies': ['_uetmsclkid', '_uetvid', '_uetsid'],
    'js': function () {
        'use strict';
        //var u = tarteaucitron.user.bingadsTag || 'uetq';
        window.uetq = window.uetq || [];

        tarteaucitron.addScript('https://bat.bing.com/bat.js', '', function () {
            var bingadsCreate = { ti: tarteaucitron.user.bingadsID };

            if ('bingadsStoreCookies' in tarteaucitron.user) {
                bingadsCreate['storeConvTrackCookies'] = tarteaucitron.user.bingadsStoreCookies;
            }

            bingadsCreate.q = window.uetq;
            window.uetq = new UET(bingadsCreate);
            window.uetq.push('pageLoad');

            if (typeof tarteaucitron.user.bingadsMore === 'function') {
                tarteaucitron.user.bingadsMore();
            }
        });
    }
};

//Matterport
tarteaucitron.services.matterport = {
    "key": "matterport",
    "type": "other",
    "name": "Matterport",
    "uri": "https://matterport.com/es/legal/privacy-policy/",
    "needConsent": true,
    "cookies": ['__cfduid', 'ajs_anonymous_id', 'ajs_group_id', 'ajs_user_id'],
    "js": function () {
        "use strict";
        tarteaucitron.fallback(['matterport'], function (x) {
            var frame_title = tarteaucitron.fixSelfXSS(x.getAttribute("title") || 'Matterport iframe'),
                matterport_id = x.getAttribute("matterportID"),
                matterport_width = x.getAttribute("width"),
                frame_width = 'width=',
                matterport_height = x.getAttribute("height"),
                frame_height = 'height=',
                matterport_parameters = x.getAttribute("parameters"),
                matterport_allowfullscreen = x.getAttribute('allowfullscreen'),
                matterport_frame;

            if (matterport_id === undefined) {
                return "";
            }
            if (matterport_width !== undefined) {
                frame_width += '"' + matterport_width + '" ';
            } else {
                frame_width += '"" ';
            }
            if (matterport_height !== undefined) {
                frame_height += '"' + matterport_height + '" ';
            } else {
                frame_height += '"" ';
            }
            if (matterport_parameters === undefined) {
                return "";
            }

            matterport_frame = '<iframe title="' + frame_title + '" type="text/html" ' + frame_width + frame_height + ' src="https://my.matterport.com/show/?m=' + matterport_id + '&utm_source=hit-content' + matterport_parameters + '"' + (matterport_allowfullscreen == '0' ? '' : ' webkitallowfullscreen mozallowfullscreen allowfullscreen') + '></iframe>';
            return matterport_frame;
        });
    },
    "fallback": function () {
        "use strict";
        var id = 'matterport';
        tarteaucitron.fallback(['matterport'], function (elem) {
            elem.style.width = elem.getAttribute('width') + 'px';
            elem.style.height = elem.getAttribute('height') + 'px';
            return tarteaucitron.engage(id);
        });
    }
};

// Adform
tarteaucitron.services.adform = {
    "key": "adform",
    "type": "ads",
    "name": "Adform",
    "uri": "https://site.adform.com/privacy-center/overview/",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";

        if (tarteaucitron.user.adformpm === undefined || tarteaucitron.user.adformpagename === undefined) {
            return;
        }

        window._adftrack = {
            pm: tarteaucitron.user.adformpm,
            divider: encodeURIComponent('|'),
            pagename: encodeURIComponent(tarteaucitron.user.adformpagename)
        };

        tarteaucitron.addScript("https://track.adform.net/serving/scripts/trackpoint/async/");
    }
};

// Active Campaign
tarteaucitron.services.activecampaign = {
    "key": "activecampaign",
    "type": "ads",
    "name": "Active Campaign",
    "uri": "https://www.activecampaign.com/privacy-policy/",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";
        if (tarteaucitron.user.actid === undefined) {
            return;
        }

        window.trackcmp_email = '';

        tarteaucitron.addScript('https://trackcmp.net/visit?actid=' + tarteaucitron.user.actid + '&e=' + encodeURIComponent(trackcmp_email) + '&r=' + encodeURIComponent(document.referrer) + '&u=' + encodeURIComponent(window.location.href));
    }
};

// tawk.to
tarteaucitron.services.tawkto = {
    "key": "tawkto",
    "type": "support",
    "name": "Tawk.to chat",
    "uri": "https://www.tawk.to/data-protection/",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";
        if (tarteaucitron.user.tawktoId === undefined) {
            return;
        }

        tarteaucitron.user.tawktoWidgetId = tarteaucitron.user.tawktoWidgetId || 'default';

        window.Tawk_API = window.Tawk_API || {};
        window.Tawk_LoadStart = new Date();

        tarteaucitron.addScript('https://embed.tawk.to/' + tarteaucitron.user.tawktoId + '/' + tarteaucitron.user.tawktoWidgetId);
    }

};

// getquanty
tarteaucitron.services.getquanty = {
    "key": "getquanty",
    "type": "analytic",
    "name": "GetQuanty",
    "uri": "https://www.getquanty.com/mentions-legales/",
    "needConsent": true,
    "cookies": ['_first_pageview', 'eqy_sessionid', 'eqy_siteid', 'cluid', 'eqy_company', 'cluid', 'gq_utm', '_jsuid'],
    "js": function () {
        "use strict";
        if (tarteaucitron.user.getguanty === undefined) {
            return;
        }

        if (tarteaucitron.user.getquantyAlreadyLoaded !== undefined) {
            return;
        }

        tarteaucitron.addScript('https://get.smart-data-systems.com/gq?site_id=' + tarteaucitron.user.getguanty + '&consent=1');
    },
    "fallback": function () {
        "use strict";
        if (tarteaucitron.user.getguanty === undefined) {
            return;
        }

        tarteaucitron.user.getquantyAlreadyLoaded = true;

        tarteaucitron.addScript('https://get.smart-data-systems.com/gq?site_id=' + tarteaucitron.user.getguanty + '&notrack=1');
    }
};

// emolytics
tarteaucitron.services.emolytics = {
    "key": "emolytics",
    "type": "analytic",
    "name": "Emolytics",
    "uri": "https://www.emolytics.com/main/privacy-policy.php",
    "needConsent": true,
    "cookies": ['__hssc', '__hssrc', '__hstc', '_ga', '_gid', 'hubspotutk', 'lang', 'incap_ses_', 'nlbi_', 'visid_incap_'],
    "js": function () {
        "use strict";
        if (tarteaucitron.user.emolyticsID === undefined) {
            return;
        }
        var scriptEmolytics = document.createElement('script');
        scriptEmolytics.text = 'var getsmily_id="' + tarteaucitron.user.emolyticsID + '";';
        document.getElementsByTagName('body')[0].appendChild(scriptEmolytics);
        tarteaucitron.addScript('https://cdn.emolytics.com/script/emolytics-widget.js')
    }
};

// youtubeapi
tarteaucitron.services.youtubeapi = {
    "key": "youtubeapi",
    "type": "video",
    "name": "Youtube (Js API)",
    "uri": "https://policies.google.com/privacy",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";
        tarteaucitron.addScript('https://www.youtube.com/player_api');
    }
};

// Facil'ITI
tarteaucitron.services.faciliti = {
    "key": "faciliti",
    "type": "other",
    "name": "Facil'ITI",
    "uri": "https://ws.facil-iti.com/mentions-legales.html",
    "needConsent": true,
    "cookies": ['FACIL_ITI_LS'],
    "js": function () {
        "use strict";
        if (tarteaucitron.user.facilitiID === undefined) {
            return;
        }

        (function (w, d, s, f) {
            w[f] = w[f] || { conf: function () { (w[f].data = w[f].data || []).push(arguments); } };
            var l = d.createElement(s), e = d.getElementsByTagName(s)[0];
            l.async = 1; l.src = 'https://ws.facil-iti.com/tag/faciliti-tag.min.js'; e.parentNode.insertBefore(l, e);
        }(window, document, 'script', 'FACIL_ITI'));
        FACIL_ITI.conf('userId', tarteaucitron.user.facilitiID);
    }
};

// userlike
tarteaucitron.services.userlike = {
    "key": "userlike",
    "type": "support",
    "name": "Userlike",
    "uri": "https://www.userlike.com/en/terms#privacy-policy",
    "needConsent": true,
    "cookies": ['uslk_s', 'uslk_e'],
    "js": function () {
        "use strict";
        if (tarteaucitron.user.userlikeKey === undefined) {
            return;
        }
        tarteaucitron.addScript('//userlike-cdn-widgets.s3-eu-west-1.amazonaws.com/' + tarteaucitron.user.userlikeKey);
    }
};

// adobeanalytics
tarteaucitron.services.adobeanalytics = {
    "key": "adobeanalytics",
    "type": "analytic",
    "name": "Adobe Analytics",
    "uri": "https://www.adobe.com/privacy/policy.html",
    "needConsent": true,
    "cookies": ['s_ecid', 's_cc', 's_sq', 's_vi', 's_fid'],
    "js": function () {
        "use strict";
        if (tarteaucitron.user.adobeanalyticskey === undefined) {
            return;
        }
        tarteaucitron.addScript('//assets.adobedtm.com/launch-' + tarteaucitron.user.adobeanalyticskey + '.min.js');
    }
};

// woopra customer journey analytics
tarteaucitron.services.woopra = {
    'key': 'woopra',
    'type': 'analytic',
    'name': 'Woopra Customer Journey Analytics',
    'uri': 'https://www.woopra.com/privacy',
    'needConsent': true,
    'cookies': ['wooTracker', 'intercom-session-erbfalba', 'intercom-id-erbfalba'],
    'js': function () {
        'use strict';
        //var w = tarteaucitron.user.woopraDomain;
        //window[w] = window[w] || [];

        (function () {
            var t, i, e, n = window, o = document, a = arguments, s = "script", r = ["config", "track", "identify", "visit", "push", "call", "trackForm", "trackClick"], c = function () { var t, i = this; for (i._e = [], t = 0; r.length > t; t++)(function (t) { i[t] = function () { return i._e.push([t].concat(Array.prototype.slice.call(arguments, 0))), i } })(r[t]) }; for (n._w = n._w || {}, t = 0; a.length > t; t++)n._w[a[t]] = n[a[t]] = n[a[t]] || new c; i = o.createElement(s), i.async = 1, i.src = "//static.woopra.com/js/w.js", e = o.getElementsByTagName(s)[0], e.parentNode.insertBefore(i, e)
        })("woopra");

        woopra.config({
            domain: tarteaucitron.user.woopraDomain
        });
        woopra.track();
    }
};

// ausha
tarteaucitron.services.ausha = {
    key: "ausha",
    type: "video",
    name: "Ausha",
    uri: "https://www.ausha.co/protection-personal-data/",
    needConsent: true,
    cookies: [],
    js: function () {
        "use strict";
        tarteaucitron.fallback(['ausha_player'], function (x) {
            var player_height = x.getAttribute('data-height'),
                podcast_id = x.getAttribute('data-podcast-id'),
                player_id = x.getAttribute('data-player-id'),
                playlist = x.getAttribute('data-playlist'),
                useshowid = x.getAttribute('data-useshowid'),
                color = x.getAttribute('data-color');

            if (podcast_id === undefined) {
                return "";
            }

            var src = 'https://player.ausha.co/index.html?podcastId=' + podcast_id + '&v=3';

            if (useshowid == "1") {
                src = 'https://player.ausha.co/index.html?showId=' + podcast_id + '&v=3';
            }

            if (playlist && playlist.length > 0) src += '&playlist=' + playlist;
            if (color && color.length > 0) src += '&color=' + color.replace('#', '%23');
            if (player_id && player_id.length > 0) src += '&playerId=' + player_id;

            return '<iframe id="' + player_id + '" loading="lazy" width="100%" height="' + player_height + '" scrolling="no" frameborder="no" src="' + src + '"></iframe>';
        });

        tarteaucitron.addScript('//player.ausha.co/ausha-player.js', 'ausha-player');
    },
    fallback: function () {
        "use strict";
        tarteaucitron.fallback(['ausha_player'], function (elem) {
            elem.style.height = elem.getAttribute('data-height') + 'px';
            return tarteaucitron.engage('ausha');
        });
    }
};

// visiblee
tarteaucitron.services.visiblee = {
    key: "visiblee",
    type: "analytic",
    name: "Visiblee",
    uri: "http://confidentiality.visiblee.io/fr/confidentialite",
    needConsent: true,
    cookies: ["visitor_v2", tarteaucitron.user.visibleedomain, "check", "campaign_ref_" + tarteaucitron.user.visibleedomain, "reload_" + tarteaucitron.user.visibleedomain],
    js: function () {
        "use strict";

        if (tarteaucitron.user.visibleeclientid === undefined) {
            return;
        }
        tarteaucitron.addScript('//www.link-page.info/tracking_' + tarteaucitron.user.visibleeclientid + '.js', 'visiblee');
    }
};

// bandcamp
tarteaucitron.services.bandcamp = {
    key: "bandcamp",
    type: "video",
    name: "Bandcamp",
    uri: "https://bandcamp.com",
    readmoreLink: "https://bandcamp.com/privacy",
    needConsent: true,
    cookies: ['client_id', 'BACKENDID', '_comm_playlist'],
    js: function () {
        "use strict";
        tarteaucitron.fallback(['bandcamp_player'], function (x) {
            var frame_title = tarteaucitron.fixSelfXSS(x.getAttribute("title") || 'Bandcamp iframe'),
                album_id = x.getAttribute("albumID"),
                bandcamp_width = x.getAttribute("width"),
                frame_width = 'width=',
                bandcamp_height = x.getAttribute("height"),
                frame_height = 'height=',
                attrs = ["size", "bgcol", "linkcol", "artwork", "minimal", "tracklist", "package", "transparent"],
                params = attrs.filter(function (a) {
                    return x.getAttribute(a) !== null;
                }).map(function (a) {
                    if (a && a.length > 0) return a + "=" + x.getAttribute(a);
                }).join("/");

            if (album_id === null) {
                return "";
            }

            if (bandcamp_width !== null || bandcamp_width !== "") {
                frame_width += '"' + bandcamp_width + '" ';
            } else {
                frame_width += '"" ';
            }
            if (bandcamp_height !== null || bandcamp_height !== "") {
                frame_height += '"' + bandcamp_height + '" ';
            } else {
                frame_height += '"" ';
            }

            var src = 'https://bandcamp.com/EmbeddedPlayer/album=' + album_id + '/' + params;

            return '<iframe title="' + frame_title + '"' + frame_width + frame_height + 'src="' + src + '" frameborder="0" allowfullscreen seamless></iframe>';
        });
    },
    fallback: function () {
        "use strict";
        tarteaucitron.fallback(['bandcamp_player'], function (elem) {
            elem.style.width = elem.getAttribute('width');
            elem.style.height = elem.getAttribute('height');
            return tarteaucitron.engage('bandcamp');
        });
    }
};

// Discord Widget
tarteaucitron.services.discord = {
    "key": "discord",
    "type": "social",
    "name": "Discord (Server Widget)",
    "needConsent": true,
    "cookies": ["__cfruid", "__dcfduid", "_ga", "_gcl_au", "OptanonConsent", "locale", "_gid"],
    "uri": "https://discord.com/privacy",
    "js": function () {
        "use strict";
        tarteaucitron.fallback(['discord_widget'], function (x) {
            var id = x.getAttribute("guildID"),
                width = x.getAttribute("width"),
                height = x.getAttribute("height")
            var widgetURL = "https://discord.com/widget?id=" + id;
            return "<iframe width=\"" + width + "\" height=\"" + height + "\" src=\"" + widgetURL + "\"></iframe>";
        });
    },
    "fallback": function () {
        "use strict";
        var id = 'discord';
        tarteaucitron.fallback(['discord_widget'], function (elem) {
            elem.style.width = elem.getAttribute('width') + 'px';
            elem.style.height = elem.getAttribute('height') + 'px';
            return tarteaucitron.engage(id);
        });
    }
};

// Google Maps
tarteaucitron.services.maps_noapi = {
    "key": "maps_noapi",
    "type": "other",
    "name": "Google Maps",
    "needConsent": true,
    "cookies": ["NID", "OGPC", "1P_JAR", "CONSENT"],
    "uri": "https://policies.google.com/privacy",
    "js": function () {
        "use strict";
        tarteaucitron.fallback(['googlemaps_embed'], function (x) {
            var id = x.getAttribute("id"),
                width = x.getAttribute("width"),
                height = x.getAttribute("height")
            var widgetURL = "https://google.com/maps/embed?pb=" + id;
            return "<iframe width=\"" + width + "\" height=\"" + height + "\" src=\"" + widgetURL + "\" style=\"border:0;\" allowfullscreen=\"\" loading=\"lazy\"></iframe>";
        });
    },
    "fallback": function () {
        "use strict";
        var id = 'maps_noapi';
        tarteaucitron.fallback(['googlemaps_embed'], function (elem) {
            elem.style.width = elem.getAttribute('width') + 'px';
            elem.style.height = elem.getAttribute('height') + 'px';
            return tarteaucitron.engage(id);
        });
    }
};

// hCaptcha
tarteaucitron.services.hcaptcha = {
    "key": "hcaptcha",
    "type": "other",
    "name": "hCaptcha",
    "needConsent": true,
    "cookies": [],
    "uri": "https://www.hcaptcha.com/privacy",
    "js": function () {
        "use strict";
        tarteaucitron.fallback(["h-captcha"], '');
        tarteaucitron.addScript("https://hcaptcha.com/1/api.js", "hcaptcha")
    },
    "fallback": function () {
        "use strict";
        var id = "hcaptcha";
        tarteaucitron.fallback(["h-captcha"], tarteaucitron.engage(id));
    }
};

// France Culture
tarteaucitron.services.fculture = {
    "key": "fculture",
    "type": "video",
    "name": "France Culture",
    "needConsent": true,
    "cookies": ["_gid", "didomi_token", "outbrain_cid_fetch", "xtvrn", "xtant", "YSC", "ABTasty", "xtan", "ABTastySession", "xtidc", "_ga", "VISITOR_INFO1_LIVE", "euconsent-v2", "v1st", "dmvk", "ts", "VISITOR_INFO1_LIVE", "YSC"],
    "uri": "https://www.radiofrance.com/politique-d-utilisation-des-cookies-sur-les-sites-internet-du-groupe-radio-france",
    "js": function () {
        "use strict";
        tarteaucitron.fallback(['fculture_embed'], function (x) {
            var id = x.getAttribute('id'),
                width = x.getAttribute('width'),
                height = x.getAttribute('height');
            return "<iframe src=\"https://www.franceculture.fr/player/export-reecouter?content=" + id + "\" height=\"" + height + "\" width=\"" + width + "\"></iframe>"
        });
    },
    "fallback": function () {
        "use strict";
        var id = "fculture";
        tarteaucitron.fallback(["fculture_embed"], tarteaucitron.engage(id));
    }
};

// Acast
tarteaucitron.services.acast = {
    "key": "acast",
    "type": "video",
    "name": "Acast",
    "needConsent": true,
    "cookies": ["intercom-id-ayi0335i", "intercom-session-ayi0335i"],
    "uri": "https://www.acast.com/en/privacy",
    "js": function () {
        "use strict";
        tarteaucitron.fallback(['acast_embed'], function (x) {
            var id = x.getAttribute('id1'),
                id2 = x.getAttribute('id2'),
                width = x.getAttribute('width'),
                height = x.getAttribute('height'),
                seek = x.getAttribute('seek');
            var widgetURL = "https://embed.acast.com/" + id + "/" + id2 + "?seek=" + seek;
            return "<iframe title=\"Embed Player\" width=\"" + width + "\" height=\"" + height + "\" src=\"" + widgetURL + "\" scrolling=\"no\" frameBorder=\"0\" style=\"border: none; overflow: hidden;\"></iframe>";
        });
    },
    "fallback": function () {
        "use strict";
        var id = "acast";
        tarteaucitron.fallback(["acast_embed"], tarteaucitron.engage(id));
    }
};

// Mixcloud
tarteaucitron.services.mixcloud = {
    "key": "mixcloud",
    "type": "video",
    "name": "Mixcloud",
    "needConsent": true,
    "cookies": ["UID", "_gat", "__stripe_mid", "_gid", "_ga", "c", "csrftoken", "__stripe_sid", "mx_t"],
    "uri": "https://www.mixcloud.com/privacy/",
    "js": function () {
        "use strict";
        tarteaucitron.fallback(['mixcloud_embed'], function (x) {
            var id = x.getAttribute('id'),
                hidecover = x.getAttribute('hidecover'),
                mini = x.getAttribute('mini'),
                light = x.getAttribute('light'),
                width = x.getAttribute('width'),
                height = x.getAttribute('height');
            return "<iframe width=\"" + width + "\" height=\"" + height + "\" src=\"https://www.mixcloud.com/widget/iframe/?hide_cover=" + hidecover + "&mini=" + mini + "&light=" + light + "&feed=" + id + "\" frameborder=\"0\" ></iframe>";
        });
    },
    "fallback": function () {
        "use strict";
        var id = "mixcloud";
        tarteaucitron.fallback(["mixcloud_embed"], tarteaucitron.engage(id));
    }
};

// Google Agenda
tarteaucitron.services.gagenda = {
    "key": "gagenda",
    "type": "other",
    "name": "Google Agenda",
    "needConsent": true,
    "cookies": ["CONSENT", "NID"],
    "uri": "https://policies.google.com/privacy",
    "js": function () {
        "use strict";
        tarteaucitron.fallback(['gagenda_embed'], function (x) {
            var calendar_data = x.getAttribute('data'),
                width = x.getAttribute('width'),
                height = x.getAttribute('height');
            return "<iframe loarding=\"lazy\" width=\"" + width + "\" height=\"" + height + "\" src=\"https://www.google.com/calendar/embed?" + calendar_data + "\" frameborder=\"0\" scrolling=\"no\" style=\"border-width:0\"></iframe>";
        });
    },
    "fallback": function () {
        "use strict";
        var id = "gagenda";
        tarteaucitron.fallback(["gagenda_embed"], tarteaucitron.engage(id));
    }
};

// Google Docs
tarteaucitron.services.gdocs = {
    "key": "gdocs",
    "type": "other",
    "name": "Google Docs",
    "needConsent": true,
    "cookies": ["CONSENT", "NID"],
    "uri": "https://policies.google.com/privacy",
    "js": function () {
        "use strict";
        tarteaucitron.fallback(['gdocs_embed'], function (x) {
            var id = x.getAttribute('id'),
                width = x.getAttribute('width'),
                height = x.getAttribute('height');
            return "<iframe width=\"" + width + "\" height=\"" + height + "\" src=\"https://docs.google.com/document/d/e/" + id + "/pub?embedded=true\"></iframe>";
        });
    },
    "fallback": function () {
        "use strict";
        var id = "gdocs";
        tarteaucitron.fallback(["gdocs_embed"], tarteaucitron.engage(id));
    }
};

// Google Sheets
tarteaucitron.services.gsheets = {
    "key": "gsheets",
    "type": "other",
    "name": "Google Sheets",
    "needConsent": true,
    "cookies": ["CONSENT", "NID"],
    "uri": "https://policies.google.com/privacy",
    "js": function () {
        "use strict";
        tarteaucitron.fallback(['gsheets_embed'], function (x) {
            var id = x.getAttribute('id'),
                width = x.getAttribute('width'),
                height = x.getAttribute('height'),
                headers = x.getAttribute('headers');
            return "<iframe width=\"" + width + "\" height=\"" + height + "\" src=\"https://docs.google.com/spreadsheets/d/e/" + id + "/pubhtml?widget=true&amp;headers=" + headers + "\"></iframe>";
        });
    },
    "fallback": function () {
        "use strict";
        var id = "gsheets";
        tarteaucitron.fallback(["gsheets_embed"], tarteaucitron.engage(id));
    }
};

// Google Slides
tarteaucitron.services.gslides = {
    "key": "gslides",
    "type": "other",
    "name": "Google Slides",
    "needConsent": true,
    "cookies": ["CONSENT", "NID"],
    "uri": "https://policies.google.com/privacy",
    "js": function () {
        "use strict";
        tarteaucitron.fallback(['gslides_embed'], function (x) {
            var id = x.getAttribute('id'),
                width = x.getAttribute('width'),
                height = x.getAttribute('height'),
                autostart = x.getAttribute('autostart'),
                loop = x.getAttribute('loop'),
                delay = x.getAttribute('delay');
            return "<iframe width=\"" + width + "\" height=\"" + height + "\" src=\"https://docs.google.com/presentation/d/e/" + id + "/embed?start=" + autostart + "&loop=" + loop + "&delayms=" + delay + "\" frameborder=\"0\" allowfullscreen=\"true\" mozallowfullscreen=\"true\" webkitallowfullscreen=\"true\"></iframe>";
        });
    },
    "fallback": function () {
        "use strict";
        var id = "gslides";
        tarteaucitron.fallback(["gslides_embed"], tarteaucitron.engage(id));
    }
};

// Google Forms
tarteaucitron.services.gforms = {
    "key": "gforms",
    "type": "other",
    "name": "Google Forms",
    "needConsent": true,
    "cookies": ["CONSENT", "NID"],
    "uri": "https://policies.google.com/privacy",
    "js": function () {
        "use strict";
        tarteaucitron.fallback(['gforms_embed'], function (x) {
            var id = x.getAttribute('id'),
                width = x.getAttribute('width'),
                height = x.getAttribute('height');
            return "<iframe width=\"" + width + "\" height=\"" + height + "\" src=\"https://docs.google.com/forms/d/e/" + id + "/viewform?embedded=true\" frameborder=\"0\" marginheight=\"0\" marginwidth=\"0\"></iframe>";
        });
    },
    "fallback": function () {
        "use strict";
        var id = "gforms";
        tarteaucitron.fallback(['gforms_embed'], tarteaucitron.engage(id));
    }
};

// Google Optimize
tarteaucitron.services.goptimize = {
    "key": "goptimize",
    "type": "other",
    "name": "Google Optimize",
    "needConsent": true,
    "cookies": ["CONSENT", "NID"],
    "uri": "https://policies.google.com/privacy",
    "js": function () {
        "use strict";

        if (tarteaucitron.user.goptimize === undefined) {
            return;
        }

        tarteaucitron.addScript('https://www.googleoptimize.com/optimize.js?id=' + tarteaucitron.user.goptimize);
    }
};

// Marketo munchkin
tarteaucitron.services.marketomunchkin = {
    "key": "marketomunchkin",
    "type": "api",
    "name": "Marketo munchkin",
    "uri": "https://documents.marketo.com/legal/cookies",
    "needConsent": true,
    "cookies": ['OptAnon', '_mkto_trk'],
    "js": function () {
        "use strict";
        if (tarteaucitron.user.marketomunchkinkey === undefined) {
            return;
        }
        var didInit = false;
        function initMunchkin() {
            if (didInit === false) {
                didInit = true;
                Munchkin.init(tarteaucitron.user.marketomunchkinkey);
            }
        }
        var s = document.createElement('script');
        s.type = 'text/javascript';
        s.async = true;
        s.src = '//munchkin.marketo.net/munchkin.js';
        s.onreadystatechange = function () {
            if (this.readyState == 'complete' || this.readyState == 'loaded') {
                initMunchkin();
            }
        };
        s.onload = initMunchkin;
        document.getElementsByTagName('head')[0].appendChild(s);
    }
};

// outbrain
tarteaucitron.services.outbrain = {
    "key": "outbrain",
    "type": "ads",
    "name": "Outbrain",
    "uri": "https://www.outbrain.com/fr/advertisers/guidelines/",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";

        tarteaucitron.addScript('https://widgets.outbrain.com/outbrain.js');
    }
};

// affilae
tarteaucitron.services.affilae = {
    "key": "affilae",
    "type": "ads",
    "name": "Affilae",
    "uri": "https://affilae.com/en/privacy-cookie-policy/",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";

        if (tarteaucitron.user.affilae === undefined) {
           return;
        }
        
        window._ae = { "pid": tarteaucitron.user.affilae };

        tarteaucitron.addScript('https://static.affilae.com/ae-v3.5.js');
    }
};

// Canal-U.tv
tarteaucitron.services.canalu = {
    "key": "canalu",
    "type": "video",
    "name": "Canal-U.tv",
    "uri": "https://www.canal-u.tv/conditions-generales-utilisations",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";
        tarteaucitron.fallback(['canalu_player'], function (x) {
            var video_title = tarteaucitron.fixSelfXSS(x.getAttribute("videoTitle")),
                frame_url = 'https://www.canal-u.tv/embed/' + video_title;

            return '<div style="position:relative;padding-bottom:56.25%;padding-top:10px;height:0;overflow:hidden;">' +
                   '<iframe src="' + frame_url + '?width=100%&amp;height=100%" ' +
                        'style="position:absolute;top:0;left:0;width:100%;height: 100%;" ' +
                        'frameborder="0" ' +
                        'allowfullscreen ' +
                        'scrolling="no">' +
                   '</iframe>' +
                   '</div>';
        });
    },
    "fallback": function () {
        "use strict";
        tarteaucitron.fallback(['canalu_player'], function (elem) {
            return tarteaucitron.engage('canalu');
        });
    }
};

// WebTV Normandie Université
tarteaucitron.services.webtvnu = {
    "key": "webtvnu",
    "type": "video",
    "name": "WebTV Normandie Université",
    "uri": "https://docs.google.com/document/d/1tpVclj4QBoAq1meSZgYrpNECwp7dbmb_IhICY3sTl9c/edit",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";
        tarteaucitron.fallback(['webtvnu_player'], function (x) {
            var frame_url = 'https://webtv.normandie-univ.fr/permalink/' + x.getAttribute("videoID") + '/iframe/',
                width = x.getAttribute("width"),
                height = x.getAttribute("height");

            return '<iframe width="' + width + '" height="' + height + '" src="' + frame_url + '" allowfullscreen="allowfullscreen" allow="autoplay"></iframe>';
        });
    },
    "fallback": function () {
        "use strict";
        tarteaucitron.fallback(['webtvnu_player'], function (elem) {
            return tarteaucitron.engage('webtvnu');
        });
    }
};

// studizz
tarteaucitron.services.studizz = {
    "key": "studizz",
    "type": "other",
    "name": "Studizz Chatbot",
    "uri": "https://group.studizz.fr/",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";

        if (tarteaucitron.user.studizzToken === undefined) {
            return;
        }

        tarteaucitron.addScript('https://webchat.studizz.fr/webchat.js?token=' + tarteaucitron.user.studizzToken);
    }
};

// meteofrance
tarteaucitron.services.meteofrance = {
    "key": "meteofrance",
    "type": "api",
    "name": "Météo France",
    "uri": "https://meteofrance.com/politique-de-confidentialite",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";
        tarteaucitron.fallback(['tac_meteofrance'], function (x) {
            var frame_title = tarteaucitron.fixSelfXSS(x.getAttribute("title") || 'Météo France iframe'),
                width = x.getAttribute("width"),
                height = x.getAttribute("height"),
                insee = x.getAttribute("data-insee"),
                allowfullscreen = x.getAttribute("allowfullscreen");

            return '<iframe title="' + frame_title + '" src="https://meteofrance.com/widget/prevision/' + insee + '" width="' + width + '" height="' + height + '" scrolling="auto" allowtransparency ' + (allowfullscreen == '0' ? '' : ' webkitallowfullscreen mozallowfullscreen allowfullscreen') + '></iframe>';
        });
    },
    "fallback": function () {
        "use strict";
        var id = 'meteofrance';
        tarteaucitron.fallback(['tac_meteofrance'], function (elem) {
            elem.style.width = elem.getAttribute('width') + 'px';
            elem.style.height = elem.getAttribute('height') + 'px';
            return tarteaucitron.engage(id);
        });
    }
};

// m6meteo
tarteaucitron.services.m6meteo = {
    "key": "m6meteo",
    "type": "api",
    "name": "M6 Météo",
    "uri": "https://gdpr.m6tech.net/charte-confidentialite-m6-web-meteocity.pdf",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";
        tarteaucitron.fallback(['tac_m6meteo'], function (x) {
            var id = x.getAttribute("data-id");

            tarteaucitron.addScript('https://www.meteocity.com/widget/js/'+id);

            return '<div id="cont_'+id+'"><div id="spa_'+id+'"><a id="a_'+id+'" href="#"></a> ©<a target="_top" href="https://www.meteocity.com">M6météo</a></div></div>';
        });
    },
    "fallback": function () {
        "use strict";
        var id = 'm6meteo';
        tarteaucitron.fallback(['tac_m6meteo'], function (elem) {

            return tarteaucitron.engage(id);
        });
    }
};

// mtcaptcha
tarteaucitron.services.mtcaptcha = {
    "key": "mtcaptcha",
    "type": "api",
    "name": "MTcaptcha",
    "uri": "https://www.mtcaptcha.com",
    "readmoreLink": "https://www.mtcaptcha.com/faq-cookie-declaration",
    "needConsent": true,
    "cookies": ['mtv1Pulse','mtv1ConfSum','mtv1Pong'],

    "js": function () {

        window.mtcaptchaConfig = {
            "sitekey": tarteaucitron.user.mtcaptchaSitekey
        };

        tarteaucitron.addScript('https://service.mtcaptcha.com/mtcv1/client/mtcaptcha.min.js');
        tarteaucitron.addScript('https://service2.mtcaptcha.com/mtcv1/client/mtcaptcha2.min.js');
    }
};

// Internet Archive / https://archive.org
tarteaucitron.services.archive = {
    "key": "archive",
    "type": "video",
    "name": "Internet Archive",
    "uri": "https://archive.org/about/terms.php",
    "needConsent": true,
    "cookies": ['abtest-identifier','donation-identifier'],
    "js": function () {
        "use strict";
        tarteaucitron.fallback(['archive_player'], function (x) {
            var video_id = tarteaucitron.getElemAttr(x, "data-videoID"),
                video_width = tarteaucitron.getElemAttr(x, "data-width"),
                frame_width = 'width=',
                video_height = tarteaucitron.getElemAttr(x, "data-height"),
                frame_height = 'height=',
                video_frame;

            if (video_id === undefined) {
                return "";
            }
            if (video_width !== undefined) {
                frame_width += '"' + video_width + '" ';
            } else {
                frame_width += '"" ';
            }
            if (video_height !== undefined) {
                frame_height += '"' + video_height + '" ';
            } else {
                frame_height += '"" ';
            }
            video_frame = '<iframe src="https://archive.org/embed/' + video_id + '" ' + frame_width + frame_height + ' frameborder="0" webkitallowfullscreen="true" mozallowfullscreen="true" allowfullscreen></iframe>';
            return video_frame;
        });
    },
    "fallback": function () {
        "use strict";
        var id = 'archive';
        tarteaucitron.fallback(['archive_player'], function (elem) {
            elem.style.width = elem.getAttribute('data-width') + 'px';
            elem.style.height = elem.getAttribute('data-height') + 'px';
            return tarteaucitron.engage(id);
        });
    }
};

// Gallica
tarteaucitron.services.gallica = {
    "key": "gallica",
    "type": "other",
    "name": "Gallica",
    "uri": "https://gallica.bnf.fr/edit/und/conditions-dutilisation-des-contenus-de-gallica",
    "needConsent": true,
    "cookies": ['dtCookie', 'dtLatC', 'dtPC', 'dtSa', 'rxVisitor', 'rxvt', 'xtvrn'],
    "js": function () {
        "use strict";
        tarteaucitron.fallback(['gallica_player'], function (x) {
            var src = tarteaucitron.getElemAttr(x, "data-src"),
                style = tarteaucitron.getElemAttr(x, "data-style"),
                frame;
            if (src === undefined) {
                return "";
            }
            frame = '<iframe style="'+ style + '" src="' + src + '"></iframe>';
            return frame;
        });
    },
    "fallback": function () {
        "use strict";
        var id = 'gallica';
        tarteaucitron.fallback(['gallica_player'], function (elem) {
            elem.style = elem.getAttribute('data-style');
            return tarteaucitron.engage(id);
        });
    }
};

// crisp
tarteaucitron.services.crisp = {
    "key": "crisp",
    "type": "other",
    "name": "Crisp Chat",
    "uri": "https://help.crisp.chat/en/article/crisp-chatbox-cookie-ip-policy-1147xor/",
    "needConsent": false,
    "cookies": ['crisp-client', '__cfduid'],
    "js": function () {
        "use strict";

        if (tarteaucitron.user.crispID === undefined) {
            return;
        }

        window.$crisp = [];
        window.CRISP_WEBSITE_ID = tarteaucitron.user.crispID;

        tarteaucitron.addScript('https://client.crisp.chat/l.js');
    }
};

// microanalytics
tarteaucitron.services.microanalytics = {
    "key": "microanalytics",
    "type": "analytic",
    "name": "MicroAnalytic",
    "uri": "https://microanalytics.io/page/privacy",
    "needConsent": false,
    "cookies": [],
    "js": function () {
        "use strict";

        if (tarteaucitron.user.microanalyticsID === undefined) {
            return;
        }

        tarteaucitron.addScript('https://microanalytics.io/js/script.js', tarteaucitron.user.microanalyticsID, undefined, true, "data-host", "https://microanalytics.io");
    }
};

// facebookcustomerchat
tarteaucitron.services.facebookcustomerchat = {
    "key": "facebookcustomerchat",
    "type": "social",
    "name": "Facebook (Customer Chat)",
    "uri": "https://www.facebook.com/policies/cookies/",
    "needConsent": true,
    "cookies": ['act','c_user','datr','dpr','presence','sb','wd','xs','/tr'],
    "js": function () {
        "use strict";

        if (tarteaucitron.user.facebookChatID === undefined) {
            return;
        }

        tarteaucitron.fallback(['fb-customerchat'], '');
	window.fbAsyncInit=function(){FB.init({appId:tarteaucitron.user.facebookChatID,autoLogAppEvents:!0,xfbml:!0,version:"v3.0"})};
	tarteaucitron.addScript('https://connect.facebook.net/' + tarteaucitron.getLocale() + '/sdk/xfbml.customerchat.js', 'facebook-jssdk');
    },
    "fallback": function () {
        "use strict";
        var id = 'facebookcustomerchat';
        tarteaucitron.fallback(['fb-customerchat'], tarteaucitron.engage(id));
    }
};

// weborama
tarteaucitron.services.weborama = {
    "key": "weborama",
    "type": "analytic",
    "name": "Weborama",
    "uri": "https://weborama.com/faq-cnil-avril-2021/",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";
        tarteaucitron.addScript('https://cstatic.weborama.fr/js/advertiserv2/adperf_conversion.js');
    }
};

// tiktok
tarteaucitron.services.tiktok = {
    "key": "tiktok",
    "type": "analytic",
    "name": "Tiktok",
    "uri": "https://www.tiktok.com/legal/tiktok-website-cookies-policy",
    "needConsent": true,
    "cookies": [],
    "js": function () {
        "use strict";

        if (tarteaucitron.user.tiktokId === undefined) {
            return;
        }

        tarteaucitron.addScript('https://analytics.tiktok.com/i18n/pixel/sdk.js?sdkid=' + tarteaucitron.user.tiktokId);

	if (typeof tarteaucitron.user.tiktokMore === 'function') {
            tarteaucitron.user.tiktokMore();
        }
    }
};

// Klaviyo
tarteaucitron.services.klaviyo = {
    "key": "klaviyo",
    "type": "ads",
    "name": "Klaviyo",
    "uri": "https://help.klaviyo.com/hc/en-us/articles/360034666712-About-Cookies-in-Klaviyo",
    "needConsent": true,
    "cookies": ['__kla_id'],
    "js": function () {
        "use strict";
        if (tarteaucitron.user.klaviyoCompanyId === undefined) {
            return;
        }
        tarteaucitron.addScript('//static.klaviyo.com/onsite/js/klaviyo.js?company_id=' + tarteaucitron.user.klaviyoCompanyId);
    }
};
;
tarteaucitron.lang={middleBarHead:"☝ 🍪",adblock:"Hello! This site is transparent and lets you choose the 3rd party services you want to allow.",adblock_call:"Please disable your adblocker to start customizing.",reload:"Refresh the page",alertBigScroll:"By continuing to scroll,",alertBigClick:"If you continue to browse this website,",alertBig:"you are allowing all third-party services",alertBigPrivacy:"This site uses cookies and gives you control over what you want to activate",alertSmall:"Manage services",personalize:"Personalize",acceptAll:"OK, accept all",close:"Close",privacyUrl:"Privacy policy",all:"Preference for all services",info:"Protecting your privacy",disclaimer:"By allowing these third party services, you accept their cookies and the use of tracking technologies necessary for their proper functioning.",allow:"Allow",deny:"Deny",noCookie:"This service does not use cookie.",useCookie:"This service can install",useCookieCurrent:"This service has installed",useNoCookie:"This service has not installed any cookie.",more:"Read more",source:"View the official website",credit:"Cookies manager by tarteaucitron.js",noServices:"This website does not use any cookie requiring your consent.",toggleInfoBox:"Show/hide informations about cookie storage",title:"Cookies management panel",cookieDetail:"Cookie detail for",ourSite:"on our site",modalWindow:"(modal window)",newWindow:"(new window)",allowAll:"Allow all cookies",denyAll:"Deny all cookies",icon:"Cookies",fallback:"is disabled.",allowed:"allowed",disallowed:"disallowed",ads:{title:"Advertising network",details:"Ad networks can generate revenue by selling advertising space on the site."},analytic:{title:"Audience measurement",details:"The audience measurement services used to generate useful statistics attendance to improve the site."},social:{title:"Social networks",details:"Social networks can improve the usability of the site and help to promote it via the shares."},video:{title:"Videos",details:"Video sharing services help to add rich media on the site and increase its visibility."},comment:{title:"Comments",details:"Comments managers facilitate the filing of comments and fight against spam."},support:{title:"Support",details:"Support services allow you to get in touch with the site team and help to improve it."},api:{title:"APIs",details:"APIs are used to load scripts: geolocation, search engines, translations, ..."},other:{title:"Other",details:"Services to display web content."},mandatoryTitle:"Mandatory cookies",mandatoryText:"This site uses cookies necessary for its proper functioning which cannot be deactivated."};;
/**
 * @file
 * Init tarteaucitron.js script.
 */

(function (Drupal, drupalSettings, tarteaucitron) {
  /**
   * Init tarteaucitron.js script.
   *
   * @type {Drupal~behavior}
   *
   * @prop {Drupal~behaviorAttach} attach
   *   Attaches the script.
   */
  Drupal.behaviors.tacjs = {
    attach: function attach() {
      if (window.alreadyLaunch) return;

      // Set base URL for TacJS Log
      tarteaucitron.baseUrl = drupalSettings.path.baseUrl;

      // Add custom texts to tarteaucitron.
      tarteaucitronCustomText = drupalSettings.tacjs.texts;

      // Add users identification to tarteaucitron.
      tarteaucitron.user = drupalSettings.tacjs.user;

      // Set expiration time in day(s)
      if (drupalSettings.tacjs.expire) {
        window.tarteaucitronExpireInDay = true;
        window.tarteaucitronForceExpire = drupalSettings.tacjs.expire;
      }

      // Workaround for #3120915: convert multiplegtagUa into a Array
      // See https://www.drupal.org/project/tacjs/issues/3120915
      if (tarteaucitron.user.multiplegtagUa) {
        tarteaucitron.user.multiplegtagUa =
          tarteaucitron.user.multiplegtagUa.split(", ");
      }

      // Workaround for #3204238: convert googleFonts into a Array
      // See https://www.drupal.org/project/tacjs/issues/3204238
      if (tarteaucitron.user.googleFonts) {
        tarteaucitron.user.googleFonts =
          tarteaucitron.user.googleFonts.split(", ");
      }

      // Add enabled services to tarteaucitron services.
      Object.keys(drupalSettings.tacjs.services)
        .filter(function (service) {
          // Filter enabled services.
          return drupalSettings.tacjs.services[service].status;
        })
        .forEach(function (service) {
          var s = drupalSettings.tacjs.services[service],
            lang = drupalSettings.path.currentLanguage,
            slanguages = s.languages,
            needConsent = s.needConsent,
            languages = [];

          // Check service
          if (!tarteaucitron.services[service]) return;

          // Check service languages
          if (slanguages) {
            Object.keys(slanguages)
              .filter(function (language) {
                return slanguages[language];
              })
              .forEach(function (language) {
                languages.push(language);
              });

          }
          // Check languages
          if (languages.length !== 0 && !languages.includes(lang)) return;

          // Set consent
          if (needConsent !== undefined) {
            tarteaucitron.services[service].needConsent = needConsent;
          }

          (tarteaucitron.job = tarteaucitron.job || []).push(service);
        });

      // Initiate tarteaucitron
      tarteaucitron.init(drupalSettings.tacjs.dialog);
    },
  };
})(Drupal, drupalSettings, tarteaucitron);
;
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.WHATWGFetch = {})));
}(this, (function (exports) { 'use strict';

  var global =
    (typeof globalThis !== 'undefined' && globalThis) ||
    (typeof self !== 'undefined' && self) ||
    (typeof global !== 'undefined' && global);

  var support = {
    searchParams: 'URLSearchParams' in global,
    iterable: 'Symbol' in global && 'iterator' in Symbol,
    blob:
      'FileReader' in global &&
      'Blob' in global &&
      (function() {
        try {
          new Blob();
          return true
        } catch (e) {
          return false
        }
      })(),
    formData: 'FormData' in global,
    arrayBuffer: 'ArrayBuffer' in global
  };

  function isDataView(obj) {
    return obj && DataView.prototype.isPrototypeOf(obj)
  }

  if (support.arrayBuffer) {
    var viewClasses = [
      '[object Int8Array]',
      '[object Uint8Array]',
      '[object Uint8ClampedArray]',
      '[object Int16Array]',
      '[object Uint16Array]',
      '[object Int32Array]',
      '[object Uint32Array]',
      '[object Float32Array]',
      '[object Float64Array]'
    ];

    var isArrayBufferView =
      ArrayBuffer.isView ||
      function(obj) {
        return obj && viewClasses.indexOf(Object.prototype.toString.call(obj)) > -1
      };
  }

  function normalizeName(name) {
    if (typeof name !== 'string') {
      name = String(name);
    }
    if (/[^a-z0-9\-#$%&'*+.^_`|~!]/i.test(name) || name === '') {
      throw new TypeError('Invalid character in header field name: "' + name + '"')
    }
    return name.toLowerCase()
  }

  function normalizeValue(value) {
    if (typeof value !== 'string') {
      value = String(value);
    }
    return value
  }

  // Build a destructive iterator for the value list
  function iteratorFor(items) {
    var iterator = {
      next: function() {
        var value = items.shift();
        return {done: value === undefined, value: value}
      }
    };

    if (support.iterable) {
      iterator[Symbol.iterator] = function() {
        return iterator
      };
    }

    return iterator
  }

  function Headers(headers) {
    this.map = {};

    if (headers instanceof Headers) {
      headers.forEach(function(value, name) {
        this.append(name, value);
      }, this);
    } else if (Array.isArray(headers)) {
      headers.forEach(function(header) {
        this.append(header[0], header[1]);
      }, this);
    } else if (headers) {
      Object.getOwnPropertyNames(headers).forEach(function(name) {
        this.append(name, headers[name]);
      }, this);
    }
  }

  Headers.prototype.append = function(name, value) {
    name = normalizeName(name);
    value = normalizeValue(value);
    var oldValue = this.map[name];
    this.map[name] = oldValue ? oldValue + ', ' + value : value;
  };

  Headers.prototype['delete'] = function(name) {
    delete this.map[normalizeName(name)];
  };

  Headers.prototype.get = function(name) {
    name = normalizeName(name);
    return this.has(name) ? this.map[name] : null
  };

  Headers.prototype.has = function(name) {
    return this.map.hasOwnProperty(normalizeName(name))
  };

  Headers.prototype.set = function(name, value) {
    this.map[normalizeName(name)] = normalizeValue(value);
  };

  Headers.prototype.forEach = function(callback, thisArg) {
    for (var name in this.map) {
      if (this.map.hasOwnProperty(name)) {
        callback.call(thisArg, this.map[name], name, this);
      }
    }
  };

  Headers.prototype.keys = function() {
    var items = [];
    this.forEach(function(value, name) {
      items.push(name);
    });
    return iteratorFor(items)
  };

  Headers.prototype.values = function() {
    var items = [];
    this.forEach(function(value) {
      items.push(value);
    });
    return iteratorFor(items)
  };

  Headers.prototype.entries = function() {
    var items = [];
    this.forEach(function(value, name) {
      items.push([name, value]);
    });
    return iteratorFor(items)
  };

  if (support.iterable) {
    Headers.prototype[Symbol.iterator] = Headers.prototype.entries;
  }

  function consumed(body) {
    if (body.bodyUsed) {
      return Promise.reject(new TypeError('Already read'))
    }
    body.bodyUsed = true;
  }

  function fileReaderReady(reader) {
    return new Promise(function(resolve, reject) {
      reader.onload = function() {
        resolve(reader.result);
      };
      reader.onerror = function() {
        reject(reader.error);
      };
    })
  }

  function readBlobAsArrayBuffer(blob) {
    var reader = new FileReader();
    var promise = fileReaderReady(reader);
    reader.readAsArrayBuffer(blob);
    return promise
  }

  function readBlobAsText(blob) {
    var reader = new FileReader();
    var promise = fileReaderReady(reader);
    reader.readAsText(blob);
    return promise
  }

  function readArrayBufferAsText(buf) {
    var view = new Uint8Array(buf);
    var chars = new Array(view.length);

    for (var i = 0; i < view.length; i++) {
      chars[i] = String.fromCharCode(view[i]);
    }
    return chars.join('')
  }

  function bufferClone(buf) {
    if (buf.slice) {
      return buf.slice(0)
    } else {
      var view = new Uint8Array(buf.byteLength);
      view.set(new Uint8Array(buf));
      return view.buffer
    }
  }

  function Body() {
    this.bodyUsed = false;

    this._initBody = function(body) {
      /*
        fetch-mock wraps the Response object in an ES6 Proxy to
        provide useful test harness features such as flush. However, on
        ES5 browsers without fetch or Proxy support pollyfills must be used;
        the proxy-pollyfill is unable to proxy an attribute unless it exists
        on the object before the Proxy is created. This change ensures
        Response.bodyUsed exists on the instance, while maintaining the
        semantic of setting Request.bodyUsed in the constructor before
        _initBody is called.
      */
      this.bodyUsed = this.bodyUsed;
      this._bodyInit = body;
      if (!body) {
        this._bodyText = '';
      } else if (typeof body === 'string') {
        this._bodyText = body;
      } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
        this._bodyBlob = body;
      } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
        this._bodyFormData = body;
      } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
        this._bodyText = body.toString();
      } else if (support.arrayBuffer && support.blob && isDataView(body)) {
        this._bodyArrayBuffer = bufferClone(body.buffer);
        // IE 10-11 can't handle a DataView body.
        this._bodyInit = new Blob([this._bodyArrayBuffer]);
      } else if (support.arrayBuffer && (ArrayBuffer.prototype.isPrototypeOf(body) || isArrayBufferView(body))) {
        this._bodyArrayBuffer = bufferClone(body);
      } else {
        this._bodyText = body = Object.prototype.toString.call(body);
      }

      if (!this.headers.get('content-type')) {
        if (typeof body === 'string') {
          this.headers.set('content-type', 'text/plain;charset=UTF-8');
        } else if (this._bodyBlob && this._bodyBlob.type) {
          this.headers.set('content-type', this._bodyBlob.type);
        } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
          this.headers.set('content-type', 'application/x-www-form-urlencoded;charset=UTF-8');
        }
      }
    };

    if (support.blob) {
      this.blob = function() {
        var rejected = consumed(this);
        if (rejected) {
          return rejected
        }

        if (this._bodyBlob) {
          return Promise.resolve(this._bodyBlob)
        } else if (this._bodyArrayBuffer) {
          return Promise.resolve(new Blob([this._bodyArrayBuffer]))
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as blob')
        } else {
          return Promise.resolve(new Blob([this._bodyText]))
        }
      };

      this.arrayBuffer = function() {
        if (this._bodyArrayBuffer) {
          var isConsumed = consumed(this);
          if (isConsumed) {
            return isConsumed
          }
          if (ArrayBuffer.isView(this._bodyArrayBuffer)) {
            return Promise.resolve(
              this._bodyArrayBuffer.buffer.slice(
                this._bodyArrayBuffer.byteOffset,
                this._bodyArrayBuffer.byteOffset + this._bodyArrayBuffer.byteLength
              )
            )
          } else {
            return Promise.resolve(this._bodyArrayBuffer)
          }
        } else {
          return this.blob().then(readBlobAsArrayBuffer)
        }
      };
    }

    this.text = function() {
      var rejected = consumed(this);
      if (rejected) {
        return rejected
      }

      if (this._bodyBlob) {
        return readBlobAsText(this._bodyBlob)
      } else if (this._bodyArrayBuffer) {
        return Promise.resolve(readArrayBufferAsText(this._bodyArrayBuffer))
      } else if (this._bodyFormData) {
        throw new Error('could not read FormData body as text')
      } else {
        return Promise.resolve(this._bodyText)
      }
    };

    if (support.formData) {
      this.formData = function() {
        return this.text().then(decode)
      };
    }

    this.json = function() {
      return this.text().then(JSON.parse)
    };

    return this
  }

  // HTTP methods whose capitalization should be normalized
  var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT'];

  function normalizeMethod(method) {
    var upcased = method.toUpperCase();
    return methods.indexOf(upcased) > -1 ? upcased : method
  }

  function Request(input, options) {
    if (!(this instanceof Request)) {
      throw new TypeError('Please use the "new" operator, this DOM object constructor cannot be called as a function.')
    }

    options = options || {};
    var body = options.body;

    if (input instanceof Request) {
      if (input.bodyUsed) {
        throw new TypeError('Already read')
      }
      this.url = input.url;
      this.credentials = input.credentials;
      if (!options.headers) {
        this.headers = new Headers(input.headers);
      }
      this.method = input.method;
      this.mode = input.mode;
      this.signal = input.signal;
      if (!body && input._bodyInit != null) {
        body = input._bodyInit;
        input.bodyUsed = true;
      }
    } else {
      this.url = String(input);
    }

    this.credentials = options.credentials || this.credentials || 'same-origin';
    if (options.headers || !this.headers) {
      this.headers = new Headers(options.headers);
    }
    this.method = normalizeMethod(options.method || this.method || 'GET');
    this.mode = options.mode || this.mode || null;
    this.signal = options.signal || this.signal;
    this.referrer = null;

    if ((this.method === 'GET' || this.method === 'HEAD') && body) {
      throw new TypeError('Body not allowed for GET or HEAD requests')
    }
    this._initBody(body);

    if (this.method === 'GET' || this.method === 'HEAD') {
      if (options.cache === 'no-store' || options.cache === 'no-cache') {
        // Search for a '_' parameter in the query string
        var reParamSearch = /([?&])_=[^&]*/;
        if (reParamSearch.test(this.url)) {
          // If it already exists then set the value with the current time
          this.url = this.url.replace(reParamSearch, '$1_=' + new Date().getTime());
        } else {
          // Otherwise add a new '_' parameter to the end with the current time
          var reQueryString = /\?/;
          this.url += (reQueryString.test(this.url) ? '&' : '?') + '_=' + new Date().getTime();
        }
      }
    }
  }

  Request.prototype.clone = function() {
    return new Request(this, {body: this._bodyInit})
  };

  function decode(body) {
    var form = new FormData();
    body
      .trim()
      .split('&')
      .forEach(function(bytes) {
        if (bytes) {
          var split = bytes.split('=');
          var name = split.shift().replace(/\+/g, ' ');
          var value = split.join('=').replace(/\+/g, ' ');
          form.append(decodeURIComponent(name), decodeURIComponent(value));
        }
      });
    return form
  }

  function parseHeaders(rawHeaders) {
    var headers = new Headers();
    // Replace instances of \r\n and \n followed by at least one space or horizontal tab with a space
    // https://tools.ietf.org/html/rfc7230#section-3.2
    var preProcessedHeaders = rawHeaders.replace(/\r?\n[\t ]+/g, ' ');
    // Avoiding split via regex to work around a common IE11 bug with the core-js 3.6.0 regex polyfill
    // https://github.com/github/fetch/issues/748
    // https://github.com/zloirock/core-js/issues/751
    preProcessedHeaders
      .split('\r')
      .map(function(header) {
        return header.indexOf('\n') === 0 ? header.substr(1, header.length) : header
      })
      .forEach(function(line) {
        var parts = line.split(':');
        var key = parts.shift().trim();
        if (key) {
          var value = parts.join(':').trim();
          headers.append(key, value);
        }
      });
    return headers
  }

  Body.call(Request.prototype);

  function Response(bodyInit, options) {
    if (!(this instanceof Response)) {
      throw new TypeError('Please use the "new" operator, this DOM object constructor cannot be called as a function.')
    }
    if (!options) {
      options = {};
    }

    this.type = 'default';
    this.status = options.status === undefined ? 200 : options.status;
    this.ok = this.status >= 200 && this.status < 300;
    this.statusText = options.statusText === undefined ? '' : '' + options.statusText;
    this.headers = new Headers(options.headers);
    this.url = options.url || '';
    this._initBody(bodyInit);
  }

  Body.call(Response.prototype);

  Response.prototype.clone = function() {
    return new Response(this._bodyInit, {
      status: this.status,
      statusText: this.statusText,
      headers: new Headers(this.headers),
      url: this.url
    })
  };

  Response.error = function() {
    var response = new Response(null, {status: 0, statusText: ''});
    response.type = 'error';
    return response
  };

  var redirectStatuses = [301, 302, 303, 307, 308];

  Response.redirect = function(url, status) {
    if (redirectStatuses.indexOf(status) === -1) {
      throw new RangeError('Invalid status code')
    }

    return new Response(null, {status: status, headers: {location: url}})
  };

  exports.DOMException = global.DOMException;
  try {
    new exports.DOMException();
  } catch (err) {
    exports.DOMException = function(message, name) {
      this.message = message;
      this.name = name;
      var error = Error(message);
      this.stack = error.stack;
    };
    exports.DOMException.prototype = Object.create(Error.prototype);
    exports.DOMException.prototype.constructor = exports.DOMException;
  }

  function fetch(input, init) {
    return new Promise(function(resolve, reject) {
      var request = new Request(input, init);

      if (request.signal && request.signal.aborted) {
        return reject(new exports.DOMException('Aborted', 'AbortError'))
      }

      var xhr = new XMLHttpRequest();

      function abortXhr() {
        xhr.abort();
      }

      xhr.onload = function() {
        var options = {
          status: xhr.status,
          statusText: xhr.statusText,
          headers: parseHeaders(xhr.getAllResponseHeaders() || '')
        };
        options.url = 'responseURL' in xhr ? xhr.responseURL : options.headers.get('X-Request-URL');
        var body = 'response' in xhr ? xhr.response : xhr.responseText;
        setTimeout(function() {
          resolve(new Response(body, options));
        }, 0);
      };

      xhr.onerror = function() {
        setTimeout(function() {
          reject(new TypeError('Network request failed'));
        }, 0);
      };

      xhr.ontimeout = function() {
        setTimeout(function() {
          reject(new TypeError('Network request failed'));
        }, 0);
      };

      xhr.onabort = function() {
        setTimeout(function() {
          reject(new exports.DOMException('Aborted', 'AbortError'));
        }, 0);
      };

      function fixUrl(url) {
        try {
          return url === '' && global.location.href ? global.location.href : url
        } catch (e) {
          return url
        }
      }

      xhr.open(request.method, fixUrl(request.url), true);

      if (request.credentials === 'include') {
        xhr.withCredentials = true;
      } else if (request.credentials === 'omit') {
        xhr.withCredentials = false;
      }

      if ('responseType' in xhr) {
        if (support.blob) {
          xhr.responseType = 'blob';
        } else if (
          support.arrayBuffer &&
          request.headers.get('Content-Type') &&
          request.headers.get('Content-Type').indexOf('application/octet-stream') !== -1
        ) {
          xhr.responseType = 'arraybuffer';
        }
      }

      if (init && typeof init.headers === 'object' && !(init.headers instanceof Headers)) {
        Object.getOwnPropertyNames(init.headers).forEach(function(name) {
          xhr.setRequestHeader(name, normalizeValue(init.headers[name]));
        });
      } else {
        request.headers.forEach(function(value, name) {
          xhr.setRequestHeader(name, value);
        });
      }

      if (request.signal) {
        request.signal.addEventListener('abort', abortXhr);

        xhr.onreadystatechange = function() {
          // DONE (success or failure)
          if (xhr.readyState === 4) {
            request.signal.removeEventListener('abort', abortXhr);
          }
        };
      }

      xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit);
    })
  }

  fetch.polyfill = true;

  if (!global.fetch) {
    global.fetch = fetch;
    global.Headers = Headers;
    global.Request = Request;
    global.Response = Response;
  }

  exports.Headers = Headers;
  exports.Request = Request;
  exports.Response = Response;
  exports.fetch = fetch;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
;
tarteaucitron.pro = function (list) {
  "use strict";
  const service = list.match(/!([a-z_]+)=([a-z]+)/i)[1];
  const status = list.match(/!([a-z_]+)=([a-z]+)/i)[2];

  if (status === "true") {
    fetch(tarteaucitron.baseUrl + "reports/tacjslog/" + service);
  }
};
;
/**
 * @file
 * External links js file.
 */

(function ($, Drupal, drupalSettings) {

  'use strict';

  Drupal.extlink = Drupal.extlink || {};

  Drupal.extlink.attach = function (context, drupalSettings) {
    if (typeof drupalSettings.data === 'undefined' || !drupalSettings.data.hasOwnProperty('extlink')) {
      return;
    }

    // Define the jQuery method (either 'append' or 'prepend') of placing the
    // icon, defaults to 'append'.
    var extIconPlacement = 'append';
    if (drupalSettings.data.extlink.extIconPlacement && drupalSettings.data.extlink.extIconPlacement != '0') {
          extIconPlacement = drupalSettings.data.extlink.extIconPlacement;
        }

    // Strip the host name down, removing ports, subdomains, or www.
    var pattern = /^(([^\/:]+?\.)*)([^\.:]{1,})((\.[a-z0-9]{1,253})*)(:[0-9]{1,5})?$/;
    var host = window.location.host.replace(pattern, '$2$3$6');
    var subdomain = window.location.host.replace(host, '');

    // Determine what subdomains are considered internal.
    var subdomains;
    if (drupalSettings.data.extlink.extSubdomains) {
      subdomains = '([^/]*\\.)?';
    }
    else if (subdomain === 'www.' || subdomain === '') {
      subdomains = '(www\\.)?';
    }
    else {
      subdomains = subdomain.replace('.', '\\.');
    }

    // Whitelisted domains.
    var whitelistedDomains = false;
    if (drupalSettings.data.extlink.whitelistedDomains) {
      whitelistedDomains = [];
      for (var i = 0; i < drupalSettings.data.extlink.whitelistedDomains.length; i++) {
        whitelistedDomains.push(new RegExp('^https?:\\/\\/' + drupalSettings.data.extlink.whitelistedDomains[i].replace(/(\r\n|\n|\r)/gm,'') + '.*$', 'i'));
      }
    }

    // Build regular expressions that define an internal link.
    var internal_link = new RegExp('^https?://([^@]*@)?' + subdomains + host, 'i');

    // Extra internal link matching.
    var extInclude = false;
    if (drupalSettings.data.extlink.extInclude) {
      extInclude = new RegExp(drupalSettings.data.extlink.extInclude.replace(/\\/, '\\'), 'i');
    }

    // Extra external link matching.
    var extExclude = false;
    if (drupalSettings.data.extlink.extExclude) {
      extExclude = new RegExp(drupalSettings.data.extlink.extExclude.replace(/\\/, '\\'), 'i');
    }

    // Extra external link CSS selector exclusion.
    var extCssExclude = false;
    if (drupalSettings.data.extlink.extCssExclude) {
      extCssExclude = drupalSettings.data.extlink.extCssExclude;
    }

    // Extra external link CSS selector explicit.
    var extCssExplicit = false;
    if (drupalSettings.data.extlink.extCssExplicit) {
      extCssExplicit = drupalSettings.data.extlink.extCssExplicit;
    }

    // Find all links which are NOT internal and begin with http as opposed
    // to ftp://, javascript:, etc. other kinds of links.
    // When operating on the 'this' variable, the host has been appended to
    // all links by the browser, even local ones.
    // In jQuery 1.1 and higher, we'd use a filter method here, but it is not
    // available in jQuery 1.0 (Drupal 5 default).
    var external_links = [];
    var mailto_links = [];
    $('a:not([data-extlink]), area:not([data-extlink])', context).each(function (el) {
      try {
        var url = '';
        if (typeof this.href == 'string') {
          url = this.href.toLowerCase();
        }
        // Handle SVG links (xlink:href).
        else if (typeof this.href == 'object') {
          url = this.href.baseVal;
        }
        if (url.indexOf('http') === 0
          && ((!internal_link.test(url) && !(extExclude && extExclude.test(url))) || (extInclude && extInclude.test(url)))
          && !(extCssExclude && $(this).is(extCssExclude))
          && !(extCssExclude && $(this).parents(extCssExclude).length > 0)
          && !(extCssExplicit && $(this).parents(extCssExplicit).length < 1)) {
          var match = false;
          if (whitelistedDomains) {
            for (var i = 0; i < whitelistedDomains.length; i++) {
              if (whitelistedDomains[i].test(url)) {
                match = true;
                break;
              }
            }
          }
          if (!match) {
            external_links.push(this);
          }
        }
        // Do not include area tags with begin with mailto: (this prohibits
        // icons from being added to image-maps).
        else if (this.tagName !== 'AREA'
          && url.indexOf('mailto:') === 0
          && !(extCssExclude && $(this).parents(extCssExclude).length > 0)
          && !(extCssExplicit && $(this).parents(extCssExplicit).length < 1)) {
          mailto_links.push(this);
        }
      }
      // IE7 throws errors often when dealing with irregular links, such as:
      // <a href="node/10"></a> Empty tags.
      // <a href="http://user:pass@example.com">example</a> User:pass syntax.
      catch (error) {
        return false;
      }
    });

    if (drupalSettings.data.extlink.extClass !== '0' && drupalSettings.data.extlink.extClass !== '') {
      Drupal.extlink.applyClassAndSpan(external_links, drupalSettings.data.extlink.extClass, extIconPlacement);
    }

    if (drupalSettings.data.extlink.mailtoClass !== '0' && drupalSettings.data.extlink.mailtoClass !== '') {
      Drupal.extlink.applyClassAndSpan(mailto_links, drupalSettings.data.extlink.mailtoClass, extIconPlacement);
    }

    if (drupalSettings.data.extlink.extTarget) {
      // Apply the target attribute to all links.
      $(external_links).filter(function () {
        // Filter out links with target set if option specified.
        return !(drupalSettings.data.extlink.extTargetNoOverride && $(this).is('a[target]'));
      }).attr({target: '_blank'});

      // Add noopener rel attribute to combat phishing.
      $(external_links).attr('rel', function (i, val) {
        // If no rel attribute is present, create one with the value noopener.
        if (val === null || typeof val === 'undefined') {
          return 'noopener';
        }
        // Check to see if rel contains noopener. Add what doesn't exist.
        if (val.indexOf('noopener') > -1) {
          if (val.indexOf('noopener') === -1) {
            return val + ' noopener';
          }
          // Noopener exists. Nothing needs to be added.
          else {
            return val;
          }
        }
        // Else, append noopener to val.
        else {
          return val + ' noopener';
        }
      });
    }

    if (drupalSettings.data.extlink.extNofollow) {
      $(external_links).attr('rel', function (i, val) {
        // When the link does not have a rel attribute set it to 'nofollow'.
        if (val === null || typeof val === 'undefined') {
          return 'nofollow';
        }
        var target = 'nofollow';
        // Change the target, if not overriding follow.
        if (drupalSettings.data.extlink.extFollowNoOverride) {
          target = 'follow';
        }
        if (val.indexOf(target) === -1) {
          return val + ' nofollow';
        }
        return val;
      });
    }

    if (drupalSettings.data.extlink.extNoreferrer) {
      $(external_links).attr('rel', function (i, val) {
        // When the link does not have a rel attribute set it to 'noreferrer'.
        if (val === null || typeof val === 'undefined') {
          return 'noreferrer';
        }
        if (val.indexOf('noreferrer') === -1) {
          return val + ' noreferrer';
        }
        return val;
      });
    }

    Drupal.extlink = Drupal.extlink || {};

    // Set up default click function for the external links popup. This should be
    // overridden by modules wanting to alter the popup.
    Drupal.extlink.popupClickHandler = Drupal.extlink.popupClickHandler || function () {
      if (drupalSettings.data.extlink.extAlert) {
        return confirm(drupalSettings.data.extlink.extAlertText);
      }
    };

    $(external_links).off("click.extlink");
    $(external_links).on("click.extlink", function (e) {
      return Drupal.extlink.popupClickHandler(e, this);
    });
  };

  /**
   * Apply a class and a trailing <span> to all links not containing images.
   *
   * @param {object[]} links
   *   An array of DOM elements representing the links.
   * @param {string} class_name
   *   The class to apply to the links.
   * @param {string} icon_placement
   *   'append' or 'prepend' the icon to the link.
   */
  Drupal.extlink.applyClassAndSpan = function (links, class_name, icon_placement) {
    var $links_to_process;
    if (drupalSettings.data.extlink.extImgClass) {
      $links_to_process = $(links);
    }
    else {
      var links_with_images = $(links).find('img, svg').parents('a');
      $links_to_process = $(links).not(links_with_images);
    }

    if (class_name !== '0') {
      $links_to_process.addClass(class_name);
    }

    // Add data-extlink attribute.
    $links_to_process.attr('data-extlink', '');

    var i;
    var length = $links_to_process.length;
    for (i = 0; i < length; i++) {
      var $link = $($links_to_process[i]);
      if (drupalSettings.data.extlink.extUseFontAwesome) {
        if (class_name === drupalSettings.data.extlink.mailtoClass) {
          $link[icon_placement]('<span class="fa-' + class_name + ' extlink"><span class="' + drupalSettings.data.extlink.extFaMailtoClasses + '" aria-label="' + drupalSettings.data.extlink.mailtoLabel + '"></span></span>');
        }
        else {
          $link[icon_placement]('<span class="fa-' + class_name + ' extlink"><span class="' + drupalSettings.data.extlink.extFaLinkClasses + '" aria-label="' + drupalSettings.data.extlink.extLabel + '"></span></span>');
        }
      }
      else {
        if (class_name === drupalSettings.data.extlink.mailtoClass) {
          $link[icon_placement]('<svg focusable="false" class="' + class_name + '" role="img" aria-label="' + drupalSettings.data.extlink.mailtoLabel + '" xmlns="http://www.w3.org/2000/svg" viewBox="0 10 70 20"><metadata><sfw xmlns="http://ns.adobe.com/SaveForWeb/1.0/"><sliceSourceBounds y="-8160" x="-8165" width="16389" height="16384" bottomLeftOrigin="true"/><optimizationSettings><targetSettings targetSettingsID="0" fileFormat="PNG24Format"><PNG24Format transparency="true" filtered="false" interlaced="false" noMatteColor="false" matteColor="#FFFFFF"/></targetSettings></optimizationSettings></sfw></metadata><title>' + drupalSettings.data.extlink.mailtoLabel + '</title><path d="M56 14H8c-1.1 0-2 0.9-2 2v32c0 1.1 0.9 2 2 2h48c1.1 0 2-0.9 2-2V16C58 14.9 57.1 14 56 14zM50.5 18L32 33.4 13.5 18H50.5zM10 46V20.3l20.7 17.3C31.1 37.8 31.5 38 32 38s0.9-0.2 1.3-0.5L54 20.3V46H10z"/></svg>');
        }
        else {
          $link[icon_placement]('<svg focusable="false" class="' + class_name + '" role="img" aria-label="' + drupalSettings.data.extlink.extLabel + '" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 40"><metadata><sfw xmlns="http://ns.adobe.com/SaveForWeb/1.0/"><sliceSourceBounds y="-8160" x="-8165" width="16389" height="16384" bottomLeftOrigin="true"/><optimizationSettings><targetSettings targetSettingsID="0" fileFormat="PNG24Format"><PNG24Format transparency="true" filtered="false" interlaced="false" noMatteColor="false" matteColor="#FFFFFF"/></targetSettings></optimizationSettings></sfw></metadata><title>' + drupalSettings.data.extlink.extLabel + '</title><path d="M48 26c-1.1 0-2 0.9-2 2v26H10V18h26c1.1 0 2-0.9 2-2s-0.9-2-2-2H8c-1.1 0-2 0.9-2 2v40c0 1.1 0.9 2 2 2h40c1.1 0 2-0.9 2-2V28C50 26.9 49.1 26 48 26z"/><path d="M56 6H44c-1.1 0-2 0.9-2 2s0.9 2 2 2h7.2L30.6 30.6c-0.8 0.8-0.8 2 0 2.8C31 33.8 31.5 34 32 34s1-0.2 1.4-0.6L54 12.8V20c0 1.1 0.9 2 2 2s2-0.9 2-2V8C58 6.9 57.1 6 56 6z"/></svg>');
        }
      }
    }
  };

  Drupal.behaviors.extlink = Drupal.behaviors.extlink || {};
  Drupal.behaviors.extlink.attach = function (context, drupalSettings) {
    // Backwards compatibility, for the benefit of modules overriding extlink
    // functionality by defining an "extlinkAttach" global function.
    if (typeof extlinkAttach === 'function') {
      extlinkAttach(context);
    }
    else {
      Drupal.extlink.attach(context, drupalSettings);
    }
  };

})(jQuery, Drupal, drupalSettings);
;
/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/

(function ($, Drupal, drupalSettings) {
  $(document).ready(function () {
    $.ajax({
      type: 'POST',
      cache: false,
      url: drupalSettings.statistics.url,
      data: drupalSettings.statistics.data
    });
  });
})(jQuery, Drupal, drupalSettings);;
/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/

Drupal.debounce = function (func, wait, immediate) {
  var timeout;
  var result;
  return function () {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var context = this;

    var later = function later() {
      timeout = null;

      if (!immediate) {
        result = func.apply(context, args);
      }
    };

    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (callNow) {
      result = func.apply(context, args);
    }

    return result;
  };
};;
/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/

(function ($, Drupal, debounce) {
  $.fn.drupalGetSummary = function () {
    var callback = this.data('summaryCallback');
    return this[0] && callback ? callback(this[0]).trim() : '';
  };

  $.fn.drupalSetSummary = function (callback) {
    var self = this;

    if (typeof callback !== 'function') {
      var val = callback;

      callback = function callback() {
        return val;
      };
    }

    return this.data('summaryCallback', callback).off('formUpdated.summary').on('formUpdated.summary', function () {
      self.trigger('summaryUpdated');
    }).trigger('summaryUpdated');
  };

  Drupal.behaviors.formSingleSubmit = {
    attach: function attach() {
      function onFormSubmit(e) {
        var $form = $(e.currentTarget);
        var formValues = $form.serialize();
        var previousValues = $form.attr('data-drupal-form-submit-last');

        if (previousValues === formValues) {
          e.preventDefault();
        } else {
          $form.attr('data-drupal-form-submit-last', formValues);
        }
      }

      $(once('form-single-submit', 'body')).on('submit.singleSubmit', 'form:not([method~="GET"])', onFormSubmit);
    }
  };

  function triggerFormUpdated(element) {
    $(element).trigger('formUpdated');
  }

  function fieldsList(form) {
    var $fieldList = $(form).find('[name]').map(function (index, element) {
      return element.getAttribute('id');
    });
    return $.makeArray($fieldList);
  }

  Drupal.behaviors.formUpdated = {
    attach: function attach(context) {
      var $context = $(context);
      var contextIsForm = $context.is('form');
      var $forms = $(once('form-updated', contextIsForm ? $context : $context.find('form')));
      var formFields;

      if ($forms.length) {
        $.makeArray($forms).forEach(function (form) {
          var events = 'change.formUpdated input.formUpdated ';
          var eventHandler = debounce(function (event) {
            triggerFormUpdated(event.target);
          }, 300);
          formFields = fieldsList(form).join(',');
          form.setAttribute('data-drupal-form-fields', formFields);
          $(form).on(events, eventHandler);
        });
      }

      if (contextIsForm) {
        formFields = fieldsList(context).join(',');
        var currentFields = $(context).attr('data-drupal-form-fields');

        if (formFields !== currentFields) {
          triggerFormUpdated(context);
        }
      }
    },
    detach: function detach(context, settings, trigger) {
      var $context = $(context);
      var contextIsForm = $context.is('form');

      if (trigger === 'unload') {
        once.remove('form-updated', contextIsForm ? $context : $context.find('form')).forEach(function (form) {
          form.removeAttribute('data-drupal-form-fields');
          $(form).off('.formUpdated');
        });
      }
    }
  };
  Drupal.behaviors.fillUserInfoFromBrowser = {
    attach: function attach(context, settings) {
      var userInfo = ['name', 'mail', 'homepage'];
      var $forms = $(once('user-info-from-browser', '[data-user-info-from-browser]'));

      if ($forms.length) {
        userInfo.forEach(function (info) {
          var $element = $forms.find("[name=".concat(info, "]"));
          var browserData = localStorage.getItem("Drupal.visitor.".concat(info));
          var emptyOrDefault = $element.val() === '' || $element.attr('data-drupal-default-value') === $element.val();

          if ($element.length && emptyOrDefault && browserData) {
            $element.val(browserData);
          }
        });
      }

      $forms.on('submit', function () {
        userInfo.forEach(function (info) {
          var $element = $forms.find("[name=".concat(info, "]"));

          if ($element.length) {
            localStorage.setItem("Drupal.visitor.".concat(info), $element.val());
          }
        });
      });
    }
  };

  var handleFragmentLinkClickOrHashChange = function handleFragmentLinkClickOrHashChange(e) {
    var url;

    if (e.type === 'click') {
      url = e.currentTarget.location ? e.currentTarget.location : e.currentTarget;
    } else {
      url = window.location;
    }

    var hash = url.hash.substr(1);

    if (hash) {
      var $target = $("#".concat(hash));
      $('body').trigger('formFragmentLinkClickOrHashChange', [$target]);
      setTimeout(function () {
        return $target.trigger('focus');
      }, 300);
    }
  };

  var debouncedHandleFragmentLinkClickOrHashChange = debounce(handleFragmentLinkClickOrHashChange, 300, true);
  $(window).on('hashchange.form-fragment', debouncedHandleFragmentLinkClickOrHashChange);
  $(document).on('click.form-fragment', 'a[href*="#"]', debouncedHandleFragmentLinkClickOrHashChange);
})(jQuery, Drupal, Drupal.debounce);;
/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/

(function ($, Drupal) {
  function DetailsSummarizedContent(node) {
    this.$node = $(node);
    this.setupSummary();
  }

  $.extend(DetailsSummarizedContent, {
    instances: []
  });
  $.extend(DetailsSummarizedContent.prototype, {
    setupSummary: function setupSummary() {
      this.$detailsSummarizedContentWrapper = $(Drupal.theme('detailsSummarizedContentWrapper'));
      this.$node.on('summaryUpdated', $.proxy(this.onSummaryUpdated, this)).trigger('summaryUpdated').find('> summary').append(this.$detailsSummarizedContentWrapper);
    },
    onSummaryUpdated: function onSummaryUpdated() {
      var text = this.$node.drupalGetSummary();
      this.$detailsSummarizedContentWrapper.html(Drupal.theme('detailsSummarizedContentText', text));
    }
  });
  Drupal.behaviors.detailsSummary = {
    attach: function attach(context) {
      DetailsSummarizedContent.instances = DetailsSummarizedContent.instances.concat(once('details', 'details', context).map(function (details) {
        return new DetailsSummarizedContent(details);
      }));
    }
  };
  Drupal.DetailsSummarizedContent = DetailsSummarizedContent;

  Drupal.theme.detailsSummarizedContentWrapper = function () {
    return "<span class=\"summary\"></span>";
  };

  Drupal.theme.detailsSummarizedContentText = function (text) {
    return text ? " (".concat(text, ")") : '';
  };
})(jQuery, Drupal);;
/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/

(function ($, Drupal) {
  Drupal.behaviors.detailsAria = {
    attach: function attach() {
      $(once('detailsAria', 'body')).on('click.detailsAria', 'summary', function (event) {
        var $summary = $(event.currentTarget);
        var open = $(event.currentTarget.parentNode).attr('open') === 'open' ? 'false' : 'true';
        $summary.attr({
          'aria-expanded': open,
          'aria-pressed': open
        });
      });
    }
  };
})(jQuery, Drupal);;
/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/

(function ($, Modernizr, Drupal) {
  function CollapsibleDetails(node) {
    this.$node = $(node);
    this.$node.data('details', this);
    var anchor = window.location.hash && window.location.hash !== '#' ? ", ".concat(window.location.hash) : '';

    if (this.$node.find(".error".concat(anchor)).length) {
      this.$node.attr('open', true);
    }

    this.setupSummaryPolyfill();
  }

  $.extend(CollapsibleDetails, {
    instances: []
  });
  $.extend(CollapsibleDetails.prototype, {
    setupSummaryPolyfill: function setupSummaryPolyfill() {
      var $summary = this.$node.find('> summary');
      $summary.attr('tabindex', '-1');
      $('<span class="details-summary-prefix visually-hidden"></span>').append(this.$node.attr('open') ? Drupal.t('Hide') : Drupal.t('Show')).prependTo($summary).after(document.createTextNode(' '));
      $('<a class="details-title"></a>').attr('href', "#".concat(this.$node.attr('id'))).prepend($summary.contents()).appendTo($summary);
      $summary.append(this.$summary).on('click', $.proxy(this.onSummaryClick, this));
    },
    onSummaryClick: function onSummaryClick(e) {
      this.toggle();
      e.preventDefault();
    },
    toggle: function toggle() {
      var _this = this;

      var isOpen = !!this.$node.attr('open');
      var $summaryPrefix = this.$node.find('> summary span.details-summary-prefix');

      if (isOpen) {
        $summaryPrefix.html(Drupal.t('Show'));
      } else {
        $summaryPrefix.html(Drupal.t('Hide'));
      }

      setTimeout(function () {
        _this.$node.attr('open', !isOpen);
      }, 0);
    }
  });
  Drupal.behaviors.collapse = {
    attach: function attach(context) {
      if (Modernizr.details) {
        return;
      }

      once('collapse', 'details', context).forEach(function (detail) {
        detail.classList.add('collapse-processed');
        CollapsibleDetails.instances.push(new CollapsibleDetails(detail));
      });
    }
  };

  var handleFragmentLinkClickOrHashChange = function handleFragmentLinkClickOrHashChange(e, $target) {
    $target.parents('details').not('[open]').find('> summary').trigger('click');
  };

  $('body').on('formFragmentLinkClickOrHashChange.details', handleFragmentLinkClickOrHashChange);
  Drupal.CollapsibleDetails = CollapsibleDetails;
})(jQuery, Modernizr, Drupal);;
