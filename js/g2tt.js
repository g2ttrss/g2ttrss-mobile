pref_IsCat = false;

if (typeof ($.cookie('g2tt_feed')) !== 'undefined') {
    pref_Feed = $.cookie('g2tt_feed');
}
if (typeof ($.cookie('g2tt_isCat')) !== 'undefined') {
    pref_IsCat = $.cookie('g2tt_isCat');
}
if (typeof ($.cookie('g2tt_viewMode')) !== 'undefined') {
    pref_ViewMode = $.cookie('g2tt_viewMode');
}
/* Not used
if (typeof ($.cookie('g2tt_textType')) !== 'undefined') {
    pref_textType = $.cookie('g2tt_textType');
}
*/
if (typeof ($.cookie('g2tt_orderBy')) !== 'undefined') {
    pref_OrderBy = $.cookie('g2tt_orderBy');
}
if (typeof ($.cookie('g2tt_feedSort')) !== 'undefined') {
    pref_FeedSort = $.cookie('g2tt_feedSort');
}

global_backCat = []; // Feed view always starts with all items
global_ids = []; // List of all article IDs currently displayed
global_parentId = '-4';

$(document).ready(function () {
		
    $('html').unbind('click').click(function () {
        $('#header-menu').removeClass('m-button-pressed');
        $('#menuDown').removeClass('hidden');
        $('#menuUp').addClass('hidden');
        
        $('.g2tt-menu').hide();
    });

    $("#login").submit(function (event) {
        if (request) {
            request.abort();
        }

        var $loginForm = $(this);
        var $inputs = $loginForm.find("input");
        var values = {};
        $inputs.each(function () {
            values[this.name] = $(this).val();
        });

        var data = {
            'op': 'login',
            'user': values['Username'],
            'password': values['Passwd'],
        };

        $inputs.prop("disabled", true);

        var request = apiCall(data);

        request.done(function (response, textStatus, jqXHR) {
            //console.log(response['content']);
             if (response['content'].error =='LOGIN_ERROR'){
                 window.alert("Username and/or Password were incorrect!");       
             }
             if (response['content'].error =='API_DISABLED'){
                 window.alert("The API Setting is disabled. Login on the desktop version and enable API in the Preferences.");       
             }
             else {
                 $.cookie('g2tt_sid', response['content'].session_id, {
                     expires: 7
                 });
                 $('.login').addClass('hidden');
                 $('#main').removeClass('hidden');
                 load();
             }
        });

        // callback handler that will be called on failure
        request.fail(function (jqXHR, textStatus, errorThrown) {
            // log the error to the console
            console.error(
                "The following error occured: " +
                textStatus, errorThrown);
        });

        // callback handler that will be called regardless
        // if the request failed or succeeded
        request.always(function () {
            // reenable the inputs
            $inputs.prop("disabled", false);
        });

        // prevent default posting of form
        event.preventDefault();
    });
//end of #login function


    // Show more items
    $('#load-more-items').unbind('click').click(function () {
        if(pref_OrderBy == "date_reverse") {
            var last = $('.entry-row').last().attr('id');
        } else {
            var last = $('.entry-row').length;
        }
        getHeadlines(last);
    });

    // Menu button
    $('#header-menu').unbind('click').click(function (event) {
        $(this).toggleClass('m-button-pressed');
	$('#menuDown').toggleClass('hidden');
        $('#menuUp').toggleClass('hidden');
        
        //Adjust the placement of the menu based on the height of the Nav bar
        //(for when category title is long)
        $('.g2tt-menu').css({top: parseInt($('.nav-bar-container').height()) - 8 + "px"});
        $('.g2tt-menu').toggle();
        event.stopPropagation();
    });

    // Refresh button
    $('#header-refresh').unbind('click').click(function () {
        $(this).addClass('m-button-pressed');
        if ($('#subscriptions').is(':hidden')) {
            location.reload(true);
        }
        else {
            refreshCats();
        }
    });

    // View mode menu selection
    $('#' + pref_ViewMode).addClass('g2tt-option-selected');
    $('.showItem').unbind('click').click(function () {
        pref_ViewMode = $(this).attr('id');
        $.cookie('g2tt_viewMode', pref_ViewMode);
        $('.showItem').removeClass('g2tt-option-selected');
        $(this).addClass('g2tt-option-selected');
        $('.feedsItem').removeClass('g2tt-option-selected');
        $('#feeds-' + pref_ViewMode).addClass('g2tt-option-selected');
        $('#entries').empty();
        $('#subscriptions').attr('class', 'hidden show-' + pref_ViewMode);
        getHeadlines();
    });

    // Order by menu selection
    $('#' + pref_OrderBy).addClass('g2tt-option-selected');
	
    
    $('.sortItem').unbind('click').click(function () {
        pref_OrderBy = $(this).attr('id');
        $.cookie('g2tt_orderBy', pref_OrderBy);
        $('.sortItem').removeClass('g2tt-option-selected');
        $(this).addClass('g2tt-option-selected');
        $('#entries').empty();
        getHeadlines();
    });

    // Back to Feeds
    $('.back-to-feeds').unbind('click').click(function () {
        refreshCats();
        showFeeds();
    });
    
    // ADDED - Subscribe to new Feeds
    $('#add-new-subscription').unbind('click').click(function () {
	    $( "#dialog-form" ).dialog( "open" );
	    getCategoriesForNewSubscribe();
	    
    });

    // View mode feeds menu selection
    $('#feeds-' + pref_ViewMode).addClass('g2tt-option-selected');
    $('#subscriptions').addClass('show-' + pref_ViewMode);
    $('.feedsItem').unbind('click').click(function () {
        pref_ViewMode = $(this).attr('id').substring(6);
        $.cookie('g2tt_viewMode', pref_ViewMode);
        $('.feedsItem').removeClass('g2tt-option-selected');
        $(this).addClass('g2tt-option-selected');
        $('.showItem').removeClass('g2tt-option-selected');
        $('#' + pref_ViewMode).addClass('g2tt-option-selected');
        $('#subscriptions').attr('class', 'show-' + $(this).attr('id').substring(6));
    });

    // Sort feeds A-Z
    if(pref_FeedSort == '1') {
        $('.feedsSort').addClass('g2tt-option-selected');
    }
    $('.feedsSort').unbind('click').click(function () {
        if(pref_FeedSort == '1') {
            pref_FeedSort = '0';
        } else {
            pref_FeedSort = '1';
        }
        $.cookie('g2tt_feedSort', pref_FeedSort);
        $(this).toggle('g2tt-option-selected');
    });

    // Back to Feeds from sub category
    $('#sub-list-back').unbind('click').click(function () {
        refreshCats();
        getFeeds(global_backCat.pop());
            $('#add-new-subscription').removeClass('hidden');

    });

    // Mark all as read
    $('#show-more-row, #menu-mark-read').unbind('click').click(function () {
        $('body').removeClass('loaded').addClass('loading');
        $('.load-more-message').html('Marking as read...');
        //remove those that need to be kept unread
        keepUnread.removeFromArray(global_ids);
        var data = new Object();
        data.op = "updateArticle";
        data.article_ids = global_ids.join(',');
        data.mode = 0;
        data.field = 2;
        var request = apiCall(data);

        request.done(function (response) {
            $('#entries').empty();
            getHeadlines();
        });
    });

    // Logout
    $('#menu-logout').unbind('click').click(function () {
        var data = new Object();
        data.op = "logout";
        var request = apiCall(data);

        request.done(function (response) {
            $.removeCookie('g2tt_feed');
            $.removeCookie('g2tt_isCat');
            $.removeCookie('g2tt_viewMode');
// Not used            $.removeCookie('g2tt_textType');
            $.removeCookie('g2tt_orderBy');
            $.removeCookie('g2tt_sid');
            location.reload(true);
        });
    });

    // Search
    // Show search
    $('#menu-search').unbind('click').click(function () {
        $('.search-box').removeClass('hidden');
        $('#search-input').focus();
    });
    // Clear and hide search
    $('#search-cancel').unbind('click').click(function () {
        $('#search-input').val('');
        $('.search-box').addClass('hidden');
    });
    // Enter in search field searches
    $('#search-input').keypress(function(e) {
        if(e.which == 13) {
            jQuery(this).blur();
            jQuery('#search-submit').focus().click();
            return false;
        }
    });
    // Remove currently displayed headlines and search
    $('#search-submit').unbind('click').click(function () {
        $('#entries').empty();
        getHeadlines();
        return false;
    });

    load();

//Added for Subscribe to New Feeds 
$('.ui-loader').remove();
  
    var feedURL = $( "#feedURL" ),
      //password = $( "#password" ),
      allFields = $( [] ).add( feedURL ),
      tips = $( ".validateTips" );
 
    function updateTips( t ) {
      tips
        .text( t )
        .addClass( "ui-state-highlight" ).removeClass("hidden");
      setTimeout(function() {
        tips.removeClass( "ui-state-highlight", 1500 );
      }, 500 );
    }
 
    function checkLength( o, n, min, max ) {
      if ( o.val().length > max || o.val().length < min ) {
        o.addClass( "ui-state-error" );
        updateTips( "Length of " + n + " must be between " +
          min + " and " + max + "." );
        return false;
      } else {
        return true;
      }
    }
    
    function firstToUpperCase( str ) {
    return str.substr(0, 5).toLowerCase() + str.substr(5);
    }
 
    function checkRegexp( o, regexp, n ) {
    var makeOvalidHttp = o.val().trim();
    console.log(firstToUpperCase(makeOvalidHttp) );
      if ( !( regexp.test( firstToUpperCase(makeOvalidHttp) ) ) ) {
        o.addClass( "ui-state-error" );
        updateTips( n );
        return false;
      } else {
        return true;
      }
    }
 
    $( "#dialog-form" ).dialog({
    
      autoOpen: false,
      //height: 300,
      dialogClass: "dialog-nav-bar",
      draggable: false,
      resizable: false,
      //position: { my: "left top", at: "left top" } ,
      position: [ 5,10] ,
      width: 300,
      modal: true,
      buttons: {
        "Subscribe": function() {
		  var bValid = true;
		  allFields.removeClass( "ui-state-error" );
		  tips.addClass( "hidden");
	 
		  bValid = bValid && checkLength( feedURL, "URL", 5, 1000 );
		  bValid = bValid && checkRegexp( feedURL, /^(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?$/, 
		  "URL must be a valid URL. Make sure the URL is correct and re-submit" );
		  
		  // From jquery.validate.js (by joern), contributed by Scott Gonzalez: http://projects.scottsplayground.com/email_address_validation/
	 
		  if ( bValid ) {
			    var catIDnum = $( "#catItems option:selected" ).val();
			    var feedURLTrimmed = firstToUpperCase(feedURL.val().trim());
			    
			    var multipleFeedSelected = $( "#feedsAvail option:selected" ).val();
			    //console.log('When subscribe is chosen again ' + multipleFeedSelected);
			    
			    if (multipleFeedSelected == null) {
				$('#feedURL').val(feedURLTrimmed);
				var subscriberesult = subscribe( feedURLTrimmed, catIDnum);
				// console.log(subscriberesult);
			    } else {
				$('#feedURL').val(multipleFeedSelected);
				var subscriberesult = subscribe( multipleFeedSelected, catIDnum);
				//console.log(subscriberesult);
			    }
			    
		
		    
		  }
        },
        Cancel: function() {
          $( this ).dialog( "close" );
        }
      },
      close: function() {
        allFields.val( "" ).removeClass( "ui-state-error" );
      }
    });

//Added for Subscribe to New Feeds 

    // Hotkeys
    $(document).bind('keydown', 'j', expandNextEntry);
    $(document).bind('keydown', 'k', expandPreviousEntry);
    $(document).bind('keydown', 'n', jumpNextEntry);
    $(document).bind('keydown', 'p', jumpPreviousEntry);
    $(document).bind('keydown', 'o', toggleCurrentEntryAsExpanded);
    $(document).bind('keydown', 'm', toggleCurrentEntryAsRead);
});



function refreshCats() {
    var data = new Object();
    data.op = "getCounters";
    data.output_mode = "fc";
    var request = apiCall(data);

    request.done(function (response) {
        var counters = response['content'];
        var cats = [];
        var feeds = [];

        for (var i = 0; i < counters.length; i++) {
            if (counters[i]['kind'] == 'cat') {
                cats[counters[i]['id']] = (counters[i]);
            } else {
                feeds[counters[i]['id']] = (counters[i]);
            }
        }
        $('.sub-row').each(function (i,j) {
            var id = $(this).attr('id').substring(10);
            var is_cat = ($(this).hasClass('open-sub-folder') || $(this).hasClass('closed-sub-folder'));

            if (id == "-4" || id == "-1") {
                $(this).find('.item-count-value').html(feeds['global-unread']['counter']);
                if (feeds['global-unread']['counter'] == '0') {
                    $(this).addClass('no-unread-sub-row').removeClass('unread-sub');
                    $('#subscriptions').removeClass('show-unread').addClass('show-all');
                } else {
                    $(this).removeClass('no-unread-sub-row').addClass('unread-sub');
                    if (pref_ViewMode == 'unread' && $('#subscriptions').hasClass('show-all')) {
                        $('#subscriptions').removeClass('show-all').addClass('show-unread');
                    }
                }
            } else if (is_cat) {
                $(this).find('.item-count-value').html(cats[id]['counter']);
                if (cats[id]['counter'] == '0') {
                    $(this).addClass('no-unread-sub-row').removeClass('unread-sub');
                } else {
                    $(this).removeClass('no-unread-sub-row').addClass('unread-sub');
                }
            } else {
                $(this).find('.item-count-value').html(feeds[id]['counter']);
                if (feeds[id]['counter'] == '0') {
                    $(this).addClass('no-unread-sub-row').removeClass('unread-sub');
                } else {
                    $(this).removeClass('no-unread-sub-row').addClass('unread-sub');
                }
            }
        });

        showEmpty();

        $('#header-refresh').removeClass('m-button-pressed');
    });
}

function showEmpty() {
    var visible = $('#sub-' + global_parentId).children(':visible');
    if (visible.length == 0) {
        $('#subscriptions').removeClass('show-unread').addClass('show-all');
    }
}

function showFeeds() {
    $('#feed').addClass('hidden');
    $('#subscriptions').removeClass('hidden');
    $('.back-to-feeds').addClass('hidden');
    $('.articlesMenu').addClass('hidden');
    $('.feedsMenu').removeClass('hidden');
    //added to show + for adding new subscriptions
    $('#add-new-subscription').removeClass('hidden');
    if (global_parentId != '-4') {
        $('#sub-list-back').removeClass('hidden');
            //added to show + for hiding new subscriptions
            $('#add-new-subscription').addClass('hidden');

    }
    $('#nav-title').html('');
}

function showArticles() {
    $('#feed').removeClass('hidden');
    $('#subscriptions').addClass('hidden');
    //added to hide + for add new subscriptions
    $('#add-new-subscription').addClass('hidden');

    $('.back-to-feeds').removeClass('hidden');
    $('.articlesMenu').removeClass('hidden');
    $('.feedsMenu').addClass('hidden');
    $('#sub-list-back').addClass('hidden');
}

function apiCall(data, asynch) {
    if (typeof (asynch) === 'undefined') asynch = true;
    data.sid = $.cookie('g2tt_sid');
    data = JSON.stringify(data);
    var request = $.ajax({
        url: global_ttrssUrl + "/api/",
        type: "post",
        dataType: "json",
        data: data,
        asynch: asynch,
    });

    return request;
}

function getHeadlines(since) {
    $('body').addClass('loading');
    $('.load-more-message').html('Loading...');
    $('.entries-count').html('');
    if (typeof (since) === 'undefined') since = 0;

    //Anytime we get headlines, check if there is a search filter
    var search = $('#search-input').val();

    var data = new Object();
    data.op = "getHeadlines";
    data.feed_id = pref_Feed;
    //data.limit = 25;
    //uses config.js to get feed limit
    data.limit = pref_Feed_limit;
    data.show_excerpt = 1;
    data.show_content = 1;
    data.include_attachments = 0;
    data.view_mode = pref_ViewMode;
    data.is_cat = pref_IsCat;
    data.include_nested = true;
    data.order_by = pref_OrderBy;
    if (pref_OrderBy == "date_reverse") {
        data.since_id = since;
    } else {
        data.skip = since;
    }
    data.search = search;
    var headlines = apiCall(data);

    headlines.done(function (response, textStatus, jqXHR) {
        if (response['status'] != 0) {
            $.removeCookie('g2tt_sid');
            getData();
            return;
        }
        headlines = response['content'];

        if (headlines.length != data.limit) {
            $('#load-more-items').hide();
        } else {
            $('#load-more-items').show();
        }
        $.each(headlines, function (index, headline) {
            global_ids.push(headline.id);
            var email_subject = headline.title;
            var email_body = '<br><h4>Sent to you via tt-rss</h4><h2><a href="' + headline.link + '">' + headline.title + '</a></h2>' + headline.content;

            var $content = $(headline.content);
            var alt = null;
            if($content.length == 1 && $content.is("img") && (alt = ($content.attr("title") || $content.attr("alt")))){
              $content = $("<div>" + $content[0].outerHTML + "<div>" + alt + "</div></div>");
            } else {
              var $container = $("<div></div>");
              $container.append($content);
              $content = $container;
            }

            var date = new Date(headline.updated * 1000);
            var entry = "<div id='" + headline.id + "' class='entry-row whisper" + ((!headline.unread) ? " read" : "") + "'> \
            <div class='entry-container'> \
            <div class='entry-top-bar'> \
            <span class='link entry-next'> \
            <span class='entry-next-fa-icon'><i class='fa fa-arrow-down'></i></span> \
            <span class='entry-next-text'>Next item</span> \
            </span> \
            <span class='link entry-collapse'> \
            <span class='entry-collapse-fa-icon'><i class='fa fa-bars'></i></span> \
            <span class='entry-collapse-text'>Collapse</span> \
            </span> \
            </div> \
            <div class='entry-header'> \
		<div class='entry-icons'> \
			<i class='favStarDiv fa fa-star-o fa-2x starBorder'> </i> \
			<i class='favStar fa fa-star fa-2x "+ ((headline.marked) ? "starActive" : "starNotActive") + "'></i> \
		</div> \
            <div class='entry-header-body'> \
            <div class='text'> \
            <span class='item-title-collapsed'>" + headline.title + "</span> \
            <a href='" + headline.link + "' \
            class='item-title item-title-link' target='_blank'>" + headline.title + "</a> \
            <span class='item-source-title'>&nbsp;-&nbsp;" + headline.feed_title + "</span> \
            <div class='item-snippet'>" + ((headline.excerpt && headline.excerpt != '&hellip;')? headline.excerpt : $(headline.content).text().substr(0, 100) + '&hellip;') + "</div> \
            </div> \
            <div class='entry-sub-header'>by " + headline.author + " on " + date.toLocaleString() + "</div> \
            </div> \
            </div> \
            <div class='entry'> \
            <div id='entry-contents' class='entry whisper'> \
            <div class='entry-annotations'></div> \
            <div class='entry-contents-inner'>" + $content[0].outerHTML + "</div> \
            </div> \
            <div class='entry-footer'> \
            <div class='entry-actions'> \
            <div class='entry-actions-primary'> \
            <i class='fa fa-book read-state link unselectable' title='Toggle read'>&nbsp;Mark unread</i> \
            <span class='link unselectable' title='Sent by mail'> \
            <i class='fa fa-envelope-o' style='vertical-align:top;'></i> \
            <a class='link unselectable' href='mailto:?subject=" + encodeURIComponent(email_subject) + "&body=" + encodeURIComponent(email_body) + "'>E-Mail</a> \
            </span> \
            <wbr /> \
            </div> \
            </div> \
            </div> \
            <div class='action-area-container'></div> \
            </div> \
            </div> \
            </div>";

            $('#entries').append(entry);
        });

        // Expand an entry
        $('.entry-header-body').unbind('click').click(function () {
            expandEntry($(this).closest('.entry-row'));
        });

        // Collapse an entry
        $('.entry-top-bar').unbind('click').click(function () {
            collapseEntry($(this).closest('.entry-row'));
        });

        // Next entry
        $('.entry-next').unbind('click').click(function (event) {
            expandEntry($(this).closest('.entry-row').next());
            event.stopPropagation();
        });

        // Toggle read
        $('.read-state').unbind('click').click(function () {
            toggleEntryAsRead($(this).closest('.entry-row'));
        });

        /*
        // Mark (star) entry
        $('.star').unbind('click').click(function () {
            var data = new Object();
            data.op = "updateArticle";
            data.article_ids = $(this).closest('.entry-row').attr('id');
            data.mode = 2;
            data.field = 0;
            var response = apiCall(data);
            $(this).toggleClass('item-star').toggleClass('item-star-active');
        });
        */
        
         // Mark NewFont (star) entry
        $('.favStarDiv').unbind('click').click(function () {
            var data = new Object();
            data.op = "updateArticle";
            data.article_ids = $(this).closest('.entry-row').attr('id');
            data.mode = 2;
            data.field = 0;
            var response = apiCall(data);
            
            $(this).next().toggleClass('starNotActive').toggleClass('starActive');
            //console.log(newstar);
        });

        // Done loading
        $('body').removeClass('loading').addClass('loaded');
        $('.load-more-message').html('Mark these items as read');
        $('.entries-count').html('Showing ' + $('.entry-row').length + ' items');
        keepUnread.clean(global_ids);
    });
}

function getTopCategories() {
    $('#nav-title').html('');
    $('#sub-list-back').addClass('hidden');
    if ($('#sub--4').length != 0) {
        $('#subscriptions-list').children().addClass('hidden');
        $('#sub--4').removeClass('hidden');
        $('.closed-sub-folder').unbind('click').click(function () {
            global_backCat.push("-4");
            $('#subscriptions-list').children().addClass('hidden');
            getFeeds($(this).attr('id').substring(10), $(this).find('.sub-item').html(), $(this).find('.item-count-value').html());
        });
    } else {
        $('body').addClass('loading').addClass('sub-tree');
        $('#loading-area-container').removeClass('hidden');

        $('#subscriptions-list').append("<div id='sub--4'></div>");

        var data = new Object();
        data.op = "getUnread";
        var request = apiCall(data);
        request.done(function (response, textStatus, jqXHR) {
            unread = response['content'].unread;

            var entry = "<div class='row whisper sub-row open-sub-folder" + ((unread > 0) ? " unread-sub" : " no-unread-sub-row") + "' id='tree-item--4'> \
        <div class='icon-cell'> \
        <i class='fa fa-folder-open fa-lg'></i> </div> \
        <div class='text sub-item'>All articles</div> \
        <div class='item-count larger whisper'> \
        <span class='item-count-value' id='tree-item--4-unread-count'>" + unread + "</span> \
        </div> \
        </div>";

            $('#sub--4').prepend(entry);

            $('#tree-item--4').unbind('click').click(function () {
                $.cookie('g2tt_feed', $(this).attr('id').substring(10));
                $.cookie('g2tt_isCat', false);
                pref_Feed = $.cookie('g2tt_feed');
                pref_IsCat = $.cookie('g2tt_isCat');
                getData();
            });
        });

        var data = new Object();
        data.op = "getCategories";
        data.enable_nested = true;
        var cats = apiCall(data);

        cats.done(function (response, textStatus, jqXHR) {
            cats = response['content'];

            cats.sort(function (a, b) {
                var db_order = ((a.order_id < b.order_id) ? -1 : ((a.order_id > b.order_id) ? 1 : 0));
                var alpha_order = ((a.title < b.title) ? -1 : ((a.title > b.title) ? 1 : 0));
                if (pref_FeedSort == '1') {
                    return alpha_order;
                } else {
                    return db_order;
                }
            });
            $.each(cats, function (index, cat) {
                var entry = "<div class='row whisper sub-row closed-sub-folder" + ((cat.unread > 0) ? " unread-sub" : " no-unread-sub-row") + " nested-sub' id='tree-item-" + cat.id + "'> \
        <div class='icon-cell'> \
        <i class='fa fa-folder fa-lg'></i></div> \
        <div class='text sub-item'>" + cat.title + "</div> \
        <div class='item-count larger whisper'> \
        <span class='item-count-value' id='tree-item-" + cat.id + "-unread-count'>" + cat.unread + "</span> \
        </div> \
        </div>";

                $('#sub--4').append(entry);

            });

            $('.closed-sub-folder').unbind('click').click(function () {
                global_backCat.push("-4");
                $('#subscriptions-list').children().addClass('hidden');
                getFeeds($(this).attr('id').substring(10), $(this).find('.sub-item').html(), $(this).find('.item-count-value').html());
            });

            // Done loading
            $('body').removeClass('loading').addClass('loaded');
            $('#loading-area-container').addClass('hidden');
        });
    }
}

function getFeeds(parent_id, parent_title, parent_unread) {
    global_parentId = parent_id;
    if (parent_id === '-4') {
        getTopCategories();
        return;
    }
    $('#nav-title').html('');
    $('#sub-list-back').removeClass('hidden');
        //added to show + for adding new subscriptions
        $('#add-new-subscription').addClass('hidden');

    if ($('#sub-' + parent_id).length != 0) {
        $('#subscriptions-list').children().addClass('hidden');
        $('#sub-' + parent_id).removeClass('hidden');
        $('.closed-sub-folder').unbind('click').click(function () {
            global_backCat.push(parent_id);
            $('#subscriptions-list').children().addClass('hidden');
            getFeeds($(this).attr('id').substring(10), $(this).find('.sub-item').html(), $(this).find('.item-count-value').html());
        });
    } else {
        $('body').addClass('loading').addClass('sub-tree');
        $('#loading-area-container').removeClass('hidden');

        var data = new Object();
        data.op = "getFeeds";
        data.cat_id = parent_id;
        data.include_nested = true;
        var feeds = apiCall(data);

        feeds.done(function (response, textStatus, jqXHR) {
            feeds = response['content'];
            feeds.sort(function (a, b) {
                var alpha_order = ((a.title < b.title) ? -1 : ((a.title > b.title) ? 1 : 0));
                if (pref_FeedSort == '1') {
                    return alpha_order;
                } else {
                    return ((a.cat_id < b.cat_id) ? -1 : ((a.cat_id > b.cat_id) ? 1 : 0));
                }
            });
            $('#subscriptions-list').append("<div id='sub-" + parent_id + "'></div>");

            var entry = "<div class='row whisper sub-row open-sub-folder" + ((parent_unread > 0) ? " unread-sub" : " no-unread-sub-row") + "' id='tree-item-" + parent_id + "'> \
        <div class='icon-cell'> \
        <i class='fa fa-folder-open fa-lg'></i> </div> \
        <div class='text sub-item'>" + parent_title + "</div> \
        <div class='item-count larger whisper'> \
        <span class='item-count-value' id='tree-item-" + parent_id + "-unread-count'>" + parent_unread + "</span> \
        </div> \
        </div>";

            $('#sub-' + parent_id).prepend(entry);

            $.each(feeds, function (index, feed) {
                var entry = "<div class='row whisper sub-row" + ((feed.unread > 0) ? " unread-sub" : " no-unread-sub-row") + "" + ((feed.is_cat) ? " closed-sub-folder" : " sub") + " nested-sub' id='tree-item-" + feed.id + "'> \
        <div class='icon-cell'> \
        <i class='fa fa-rss-square'></i> </div> \
        <div class='text sub-item'>" + feed.title + "</div> \
        <div class='item-count larger whisper'> \
        <span class='item-count-value' id='tree-item-" + feed.id + "-unread-count'>" + feed.unread + "</span> \
        </div> \
        </div>";

                $('#sub-' + parent_id).append(entry);

            });

            $('.closed-sub-folder').unbind('click').click(function () {
                global_backCat.push(parent_id);
                $('#subscriptions-list').children().addClass('hidden');
                getFeeds($(this).attr('id').substring(10), $(this).find('.sub-item').html(), $(this).find('.item-count-value').html());
            });

            $('.open-sub-folder[id!="tree-item--4"]').unbind('click').click(function () {
                $.cookie('g2tt_feed', $(this).attr('id').substring(10));
                $.cookie('g2tt_isCat', true);
                pref_Feed = $.cookie('g2tt_feed');
                pref_IsCat = $.cookie('g2tt_isCat');
                getData();
            });

            $('.sub').unbind('click').click(function () {
                $.cookie('g2tt_feed', $(this).attr('id').substring(10));
                $.cookie('g2tt_isCat', false);
                pref_Feed = $.cookie('g2tt_feed');
                pref_IsCat = $.cookie('g2tt_isCat');
                getData();
            });

            // Done loading
            $('body').removeClass('loading').addClass('loaded');
            $('#loading-area-container').addClass('hidden');
        });
    }
}

function getTitle() {
    var data = new Object();
    if (pref_IsCat == "true") {
        data.op = "getCategories";
    } else {
        data.op = "getFeeds";
        data.cat_id = "-4";
    }

    var request = apiCall(data);

    request.done(function (response, textStatus, jqXHR) {
        if (response['status'] != 0) {
            $.removeCookie('g2tt_sid');
            getData();
            return;
        }
        items = response['content'];

        $.each(items, function (index, item) {
            if (item.id == pref_Feed) {
                $('#nav-title').html(item.title);
                return;
            }
        });
    });
}

function load() {
   if (typeof ($.cookie('g2tt_sid')) === 'undefined') {
        $('#main').addClass('hidden');
        $('.login').removeClass('hidden');
    } else if (pref_StartInCat == '1') {
        showFeeds();
        getTopCategories();
    } else {
        getTitle();
        getHeadlines();
        getTopCategories();
    }
}

function getData() {
    showArticles();
    $('body').removeClass('loaded').addClass('loading');
    $('.load-more-message').html('Marking as read...');
    $('#entries').empty();
    global_ids = [];
    getTitle();
    getHeadlines();
}

var keepUnread = new function() {
    var COOKIE_NAME = 'g2tt_keepUnread_ids';
    this.keepUnreadIdMap = undefined;

    this.hasId = function (ids, articleId) {
        return true == getIdMap[articleId];
    };
    this.removeId = function (articleId) {
        delete getIdMap()[articleId];
    };
    this.addId = function (articleId) {
        getIdMap()[articleId] = true;
        this.save();
    };
    this.clean = function (ids) {
        //check that global_keepUnread_ids does not contain items which are no longer in global_ids
        var keepUnreadIds = getIdMap();
        if (ids.length > 0) {
            for (var id in keepUnreadIds) {
                id = id|0;//id must be numeric
                if ($.inArray(id, ids) < 0) {
                    this.removeId(id);
                }
            }
        }
        this.save();
    };

    var getIdMap = function () {
        if (undefined == this.keepUnreadIdMap) {
            //attempt to load from cookie
            this.keepUnreadIdMap = [];
            var savedKeepUnread_ids;
            if (typeof ($.cookie(COOKIE_NAME)) !== 'undefined') {
                savedKeepUnread_ids = $.cookie(COOKIE_NAME);
            }

            if (savedKeepUnread_ids && savedKeepUnread_ids.length > 0) {
                var idList = savedKeepUnread_ids.split(',');
                for (var i=0; i < idList.length; i++) {
                    this.keepUnreadIdMap[idList[i]] = true;
                }
            }
        }
        return this.keepUnreadIdMap;
    };

    /*given array of ids, remove all that need to be kept unread*/
    this.removeFromArray = function (ids) {
        var keepUnreadIds = getIdMap();
        for (var id in keepUnreadIds) {
            id = id|0;//id must be numeric
            var index = $.inArray(id, ids);
            if ( index >= 0) {
                ids.splice(index, 1);
            }
        }
    };
    this.save = function () {
        var strVal = '';
        var keepIdMap = getIdMap();
        for (articleId in keepIdMap) {
            if (strVal.length > 0) {
                strVal += ',';
            }
            strVal += articleId;
        }
        $.cookie(COOKIE_NAME, strVal);
    };
}


//ADDED for subscribing to new feeds

function subscribe( feedurl, categoryID) {
	

    var subscribeResult = "";
    var data = new Object();
            data.op = "subscribeToFeed";
            data.feed_url = feedurl;
            data.category_id = categoryID;
            //data.sid = session_id;
            $('#indicator').removeClass('hidden');
            var request = apiCall(data);
            
         
//    return request;
     //var request = apiCall(data);

    request.done(function (response, textStatus, jqXHR) {
	var content = response['content'];
        var message = response['content'].status.message;
        var status = response['content'].status;
        var statusCode = response['content'].status.code;
        //var feeds = [];
        var feeds = response['content'].status.feeds;
        var feedUrls = [];
        var feedUrlsTitles = [];
		
	for (var key in feeds) {
	    if (feeds.hasOwnProperty(key)) {
		    
	      feedUrls.push(key);
	      feedUrlsTitles.push(feeds[key]);  
	    }
	}
        
        
        //console.log(statusCode);
        switch(statusCode) {
        case 0:
	//0 - OK, Feed already exists
        	//var status0 = confirm('Feed already exists in your feed list. Press OK to return to feed list, or Cancel to try again.');
        	$('#indicator').addClass('hidden');
        	window.alert('Feed already exists in your feed list.');
        	
        	//uncomment next line if you'd like it to close pop-up when they press OK.
		//$( "#dialog-form" ).dialog( "close" );
        	
        	break;
	case 1: 
	//1 - OK, Feed added
		$('#indicator').addClass('hidden');
		var tips = $( ".validateTips" );
		tips.text( 'Your Feed was Added' )
		.addClass( "ui-state-highlight" ).removeClass("hidden");
		$('#multipleFeedNotice').addClass('hidden');
             	$('#multipleFeedsSelect').addClass('hidden');
		setTimeout(function() {
		//tips.removeClass( "ui-state-highlight", 1500 );
		
		$('#feedURL').val("");
		}, 100 );

        	//uncomment next line if you'd like it to close pop-up when subscription is added.
		//$( "#dialog-form" ).dialog( "close" );
		break;
	case 2: 
	//2 - Invalid URL
		$('#indicator').addClass('hidden');
		$('#multipleFeedNotice').addClass('hidden');
		$('#multipleFeedsSelect').addClass('hidden');
		window.alert('Invalid URL submitted. Please check URL and try again.');

		break;
	case 3:
	//3 - URL content is HTML, no feeds available
		$('#indicator').addClass('hidden');
		$('#multipleFeedNotice').addClass('hidden');
		$('#multipleFeedsSelect').addClass('hidden');
		window.alert('URL content is HTML, no feeds available. Please check that URL has feeds and try again.');
		
		break;
	case 4: 
	//4 - URL content is HTML which contains multiple feeds.
		$('#indicator').addClass('hidden');
		$('#multipleFeedNotice').removeClass('hidden');
             	$('#multipleFeedsSelect').removeClass('hidden');
             	        console.log(feeds);
		//$('#feedsAvail').append( $('<option></option>').val('').html('Choose available feed') );

             	$.each(feeds, function(url, title){
		$('#feedsAvail').append( $('<option></option>').val(url).html(title) );
		
		});
             	console.log('Populate Multiple FeedsNew');
		break;
	case 5: 
	//5 - Couldn't download the URL content.
		$('#indicator').addClass('hidden');
		$('#multipleFeedNotice').addClass('hidden');
		$('#multipleFeedsSelect').addClass('hidden');
		window.alert('Unable to download the URL content. Please check your internet connection or the URL and try again.');
		
		break;
	case 6:
	//6 - Content is an invalid XML.
		$('#indicator').addClass('hidden');
		$('#multipleFeedNotice').addClass('hidden');
		$('#multipleFeedsSelect').addClass('hidden');
		window.alert('Content is an invalid XML format. Please visit the website you are trying to add to verify they use XML feed output.');
		
		break;
        }
        
        
        
        
        return response;
        
        	/**
	 * @return array (code => Status code, message => error message if available)
	 *
	 *                 0 - OK, Feed already exists
	 *                 1 - OK, Feed added
	 *                 2 - Invalid URL
	 *                 3 - URL content is HTML, no feeds available
	 *                 4 - URL content is HTML which contains multiple feeds.
	 *                     Here you should call extractfeedurls in rpc-backend
	 *                     to get all possible feeds.
	 *                 5 - Couldn't download the URL content.
	 *                 6 - Content is an invalid XML.
	 */
        
        
    });
    	//$('#indicator').addClass('hidden');

}


//haven't implemented yet.
function unSubscribe(url, session_id, feed_id) {
    var subscribeResult = "";
    var data = {
        op: "unsubscribeFeed",
        sid: session_id,
        feed_id: feed_id
    };
            
      $.ajax({
          type: "POST",
          url: url + "/api/",
          contentType: "application/json",
          data: JSON.stringify(data),
          dataType: "json",
          async:false,
          success: function(data)
          {
              subscribeResult = data.content.status;

          },
          error: function()
          {
            showAlert("Network Error, Please Check Network","ttRss");
          }
      });
    return subscribeResult;
}

function getCategoriesForNewSubscribe() {
 var data = new Object();
 data.op = "getFeedTree";
 data.include_empty = true;
//        data.op = "getCategories";
        data.enable_nested = false;
        var catsForNew = apiCall(data);

        catsForNew.done(function (response, textStatus, jqXHR) {
            catsForNew = response['content'];
           // console.log(catsForNew);
            
            $('#catItems').find('option').remove();
            $('#catItems').append( $('<option></option>').val(0).html('Uncategorized') );
            
            $.each(catsForNew, function (index, cat) {
            	$.each(cat.items, function (index, catObject){
            	//console.log(index);
            	var catObjectIds = [];
            	if (catObject.bare_id != -1 && catObject.bare_id != 0 ) {
            	catObjectIds.push({"parent_id":catObject.bare_id,"child_id":catObject.bare_id,"Name":catObject.name});
            	}
            //	console.log(catObjectIds);
            //	console.log(catObject);
			$.each(catObject.items, function(index, subcatObject){
					var subcatObjectIds = [];
					
					if (subcatObject.type == "category") {
					//subcatObjectIds.push({"parent_id":catObject.bare_id,"child_id":subcatObject.bare_id,"Name":subcatObject.name});
					catObjectIds.push({"parent_id":catObject.bare_id,"child_id":subcatObject.bare_id,"Name":subcatObject.name});
					//console.log(subcatObjectIds.Name);
					//console.log(catObject,subcatObject);

					}
			//console.log(subcatObject);
			});
			
			//put Uncategorized first
			
			
			$.each(catObjectIds, function(index, objects){
			
				$.each(objects, function(parent_id, child_id, Name ) {
					//	console.log(parent_id);
					//$('#catItems').append( $('<option></option>').val(val).html(text) )
				}); 
			if (objects.parent_id == objects.child_id) {
				
			$('#catItems').append( $('<option></option>').val(objects.parent_id).html(objects.Name) );
			} else {
			var newOptionCat = $('#catItems').append( $('<option></option>').val(objects.child_id).html('&lfloor; ' + objects.Name) );
				//newOptionCat.prepend('&lfloor;');
			}
			
			
			//console.log(objects.parent_id);
			//console.log(objects.child_id);
			//console.log(objects.Name);
			});
			
		});
           
            });

            
            
        });

}

function expandEntry($entryRow) {
    if ($entryRow.hasClass('expanded')) {
        return;
    }

    $('.expanded').removeClass('expanded');
    $entryRow.addClass('expanded');
    $('html,body').scrollTop($entryRow.offset().top);

    $('.current-entry').removeClass('current-entry');
    $entryRow.addClass('current-entry');

    // Mark as read
    if (! $entryRow.hasClass('read')) {
        $entryRow.addClass('read');
        var data = new Object();
        data.op = "updateArticle";
        data.article_ids = $entryRow.attr('id');
        data.mode = 0;
        data.field = 2;
        var response = apiCall(data);
    }
}

function collapseEntry($entryRow) {
    $entryRow.removeClass('expanded');
}

function toggleEntryAsExpanded($entryRow) {
    if ($entryRow.hasClass('expanded')) {
        collapseEntry($entryRow);

    } else {
        expandEntry($entryRow);
    }
}

function toggleCurrentEntryAsExpanded($entryRow) {
    if ($('.current-entry').length) {
        toggleEntryAsExpanded($('.current-entry'));
    }
}

function expandNextEntry() {
    if (! $('.current-entry').length) {
        $nextEntry = $('.entry-row').eq(0);

    } else {
        $nextEntry = $('.current-entry').next();
    }

    if (! $nextEntry.is('.entry-row')) {
        return;
    }

    expandEntry($nextEntry);
}

function expandPreviousEntry() {
    if (! $('.current-entry').length) {
        return
    }

    $previous = $('.current-entry').prev();

    if (! $previous.is('.entry-row')) {
        return;
    }

    expandEntry($previous);
}

function jumpNextEntry() {
    if (! $('.current-entry').length) {
        $nextEntry = $('.entry-row').eq(0);

    } else {
        $nextEntry = $('.current-entry').next();
    }

    if (! $nextEntry.is('.entry-row')) {
        return;
    }

    $('.current-entry').removeClass('current-entry');
    $nextEntry.addClass('current-entry');

    if (! isElementInViewport($('.current-entry'))) {
        $('.current-entry')[0].scrollIntoView(false);
    }
}

function jumpPreviousEntry() {
    if (! $('.current-entry').length) {
        return
    }

    $previous = $('.current-entry').prev();

    if (! $previous.is('.entry-row')) {
        return;
    }

    $('.current-entry').removeClass('current-entry');
    $previous.addClass('current-entry');

    if (! isElementInViewport($('.current-entry'))) {
        $('.current-entry')[0].scrollIntoView();
    }
}

function toggleEntryAsRead($entryRow) {
    $entryRow.toggleClass('read');

    if (! $entryRow.hasClass('read')) {
        $entryRow.find(".read-state").html("&nbsp;Mark read");
        for (var i = 0; i < global_ids.length; i++) {
            var articleId = $entryRow.attr('id');
            if (global_ids[i] == articleId) {
                global_ids.splice(i,1);
                keepUnread.addId(articleId);
            }
        }
    } else {
        $entryRow.find(".read-state").html("&nbsp;Mark unread");
        var articleId = $entryRow.attr('id');
        global_ids.push(articleId);
        keepUnread.removeId(articleId);
    }

    var data = new Object();
    data.op = "updateArticle";
    data.article_ids = $entryRow.attr('id');
    data.mode = 2;
    data.field = 2;
    var response = apiCall(data);
}

function toggleCurrentEntryAsRead($entryRow) {
    if ($('.current-entry').length) {
        toggleEntryAsRead($('.current-entry'));
    }
}

// source: http://stackoverflow.com/a/7557433/1135429
function isElementInViewport (el) {
    //special bonus for those using jQuery
    if (typeof jQuery === "function" && el instanceof jQuery) {
        el = el[0];
    }

    var rect = el.getBoundingClientRect();

    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && /*or $(window).height() */
        rect.right <= (window.innerWidth || document.documentElement.clientWidth) /*or $(window).width() */
    );
}
