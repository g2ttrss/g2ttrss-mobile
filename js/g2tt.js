if (typeof ($.cookie('g2tt_feed')) !== 'undefined') {
    pref_Feed = $.cookie('g2tt_feed');
}
if (typeof ($.cookie('g2tt_isCat')) !== 'undefined') {
    pref_IsCat = $.cookie('g2tt_isCat');
}
if (typeof ($.cookie('g2tt_viewMode')) !== 'undefined') {
    pref_ViewMode = $.cookie('g2tt_viewMode');
}
if (typeof ($.cookie('g2tt_textType')) !== 'undefined') {
    pref_textType = $.cookie('g2tt_textType');
}
if (typeof ($.cookie('g2tt_orderBy')) !== 'undefined') {
    pref_OrderBy = $.cookie('g2tt_orderBy');
}

global_backCat = []; // Feed view always starts with all items
global_ids = []; // List of all article IDs currently displayed

$(document).ready(function () {
    $('html').unbind('click').click(function () {
        $('#header-menu').removeClass('m-button-pressed');
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
            console.log(response['content']);
            $.cookie('g2tt_sid', response['content'].session_id, {
                expires: 7
            });
            $('.login').addClass('hidden');
            $('#main').removeClass('hidden');
            getData();
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

    getData();


    // Show more items
    $('#show-more-row').unbind('click').click(function () {
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
        $('.g2tt-menu').toggle();
        event.stopPropagation();
    });

    // Refresh button
    $('#header-refresh').unbind('click').click(function () {
        $(this).toggleClass('m-button-pressed');
        var data = new Object();
        data.op = "updateFeed";
        data.feed_id = pref_Feed;
        apiCall(data, false);
        location.reload(true);
    });

    // View mode menu selection
    $('#' + pref_ViewMode).addClass('g2tt-option-selected');
    $('.showItem').unbind('click').click(function () {
        pref_ViewMode = $(this).attr('id');
        $.cookie('g2tt_viewMode', pref_ViewMode);
        $('.showItem').removeClass('g2tt-option-selected');
        $(this).addClass('g2tt-option-selected');
        $('#entries').empty();
        $('.feedsItem').removeClass('g2tt-option-selected');
        $('#feeds-' + $(this).attr('id')).addClass('g2tt-option-selected');
        $('#subscriptions').removeClass().addClass('show-' + $(this).attr('id'));
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
        $('#feed').addClass('hidden');
        $('#subscriptions').removeClass('hidden');
        $('.back-to-feeds').addClass('hidden');
        $('.g2tt-menu').children().not('#seperator4, #menu-logout').toggle('hidden');
        getTopCategories();
    });

    // View mode feeds menu selection
    $('#feeds-' + pref_ViewMode).addClass('g2tt-option-selected');
    $('#subscriptions').addClass('show-' + pref_ViewMode);
    $('.feedsItem').unbind('click').click(function () {
        pref_ViewMode = $(this).attr('id').substring(6);
        $.cookie('g2tt_viewMode', pref_ViewMode);
        $('.feedsItem').removeClass('g2tt-option-selected');
        $(this).addClass('g2tt-option-selected');
        $('#subscriptions').removeClass().addClass('show-' + $(this).attr('id').substring(6));
    });

    // Back to Feeds from sub category
    $('#sub-list-back').unbind('click').click(function () {
        getFeeds(global_backCat.pop());
    });

    // Mark all as read
    $('#mark-these-read, #menu-mark-read').unbind('click').click(function () {
        $('body').removeClass('loaded').addClass('loading');
        $('.load-more-message').html('Marking as read...');
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
            $.removeCookie('g2tt_textType');
            $.removeCookie('g2tt_orderBy');
            $.removeCookie('g2tt_sid');
            location.reload(true);
        });
    });

    // Search
    $('#menu-search').unbind('click').click(function () {});

});

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

    var data = new Object();
    data.op = "getHeadlines";
    data.feed_id = pref_Feed;
    data.limit = 15;
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
    var headlines = apiCall(data);

    headlines.done(function (response, textStatus, jqXHR) {
        if (response['status'] != 0) {
            $.removeCookie('g2tt_sid');
            getData();
            return;
        }
        headlines = response['content'];

        // API isn't returning them in the requested sort order, so sort manually.
// This sorting makes the article IDs out of oder which breaks some logic around getting
//the next articles, commenting out for now
//        var order_by = (pref_OrderBy == "date_reverse" ? 1 : -1);
//        headlines.sort(function (a, b) {
//          return order_by * ((a.updated < b.updated) ? -1 : ((a.updated > b.updated) ? 1 : 0));
//        });

        $.each(headlines, function (index, headline) {
            global_ids.push(headline.id);
            var email_subject = headline.title;
            var email_body = '<br><h4>Sent to you via tt-rss</h4><h2><a href="' + headline.link + '">' + headline.title + '</a></h2>' + headline.content;
            
            var date = new Date(headline.updated * 1000);
            var entry = "<div id='" + headline.id + "' class='entry-row whisper" + ((!headline.unread) ? " read" : "") + "'> \
            <div class='entry-container'> \
            <div class='entry-top-bar'> \
            <span class='link entry-next'> \
            <span class='entry-next-icon'>&nbsp;</span> \
            <span class='entry-next-text'>Next item</span> \
            </span> \
            <span class='link entry-collapse'> \
            <span class='entry-collapse-icon'>&nbsp;</span> \
            <span class='entry-collapse-text'>Collapse</span> \
            </span> \
            </div> \
            <div class='entry-header'> \
            <div class='entry-icons'> \
            <div class='item-star" + ((headline.marked) ? "-active" : "") + " star link unselectable empty'></div> \
            </div> \
            <div class='entry-header-body'> \
            <div class='text'> \
            <span class='item-title-collapsed'>" + headline.title + "</span> \
            <a href='" + headline.link + "' \
            class='item-title item-title-link' target='_blank'>" + headline.title + "</a> \
            <span class='item-source-title'>&nbsp;-&nbsp;" + headline.feed_title + "</span> \
            <div class='item-snippet'>" + headline.excerpt + "</div> \
            </div> \
            <div class='entry-sub-header'>by " + headline.author + " on " + date.toLocaleString() + "</div> \
            </div> \
            </div> \
            <div class='entry'> \
            <div id='entry-contents' class='entry whisper'> \
            <div class='entry-annotations'></div> \
            <div class='entry-contents-inner'>" + headline.content + "</div> \
            </div> \
            <div class='entry-footer'> \
            <div class='entry-actions'> \
            <div class='entry-actions-primary'> \
            <span class='read-state-unread read-state link unselectable' title='Mark as read'>Mark as read</span> \
            <span class='email link unselectable' title='Sent by mail'> \
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
            if ($(this).closest('.entry-row').hasClass('expanded')) {
                return;
            }

            $('.expanded').removeClass('expanded');
            $(this).closest('.entry-row').addClass('expanded');
            $('html,body').scrollTop($(this).closest('.entry-row').offset().top);

            // Mark as read
            $(this).closest('.entry-row').addClass('read');
            $(this).closest('.entry-row').find('.read-state').addClass('read-state-read').removeClass('read-state-unread');
            var data = new Object();
            data.op = "updateArticle";
            data.article_ids = $(this).closest('.entry-row').attr('id');
            data.mode = 0;
            data.field = 2;
            var response = apiCall(data);
        });

        // Collapse an entry
        $('.entry-top-bar').unbind('click').click(function () {
            $(this).closest('.entry-row').removeClass('expanded');
        });

        // Next entry
        $('.entry-next').unbind('click').click(function (event) {
            $(this).closest('.entry-row').next().find('.entry-header-body').trigger('click');
            event.stopPropagation();
        });

        // Toggle read
        $('.read-state').unbind('click').click(function () {
            $(this).closest('.entry-row').toggleClass('read');
            $(this).toggleClass('read-state-read').toggleClass('read-state-unread');

            if ($(this).hasClass('read-state-unread')) {
                for (var i = 0; i < global_ids.length; i++) {
                    if (global_ids[i] == $(this).closest('.entry-row').attr('id')) {
                        global_ids.splice(i,1);
                    }
                }
            } else {
                global_ids.push($(this).closest('.entry-row').attr('id'));
            }

            var data = new Object();
            data.op = "updateArticle";
            data.article_ids = $(this).closest('.entry-row').attr('id');
            data.mode = 2;
            data.field = 2;
            var response = apiCall(data);
        });

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

        // Done loading
        $('body').removeClass('loading').addClass('loaded');
        $('.load-more-message').html('Load more items...');
        $('.entries-count').html('Showing ' + $('.entry-row').length + ' items');
    });
}

function getTopCategories() {
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
        <div class='icon'></div> \
        </div> \
        <div class='text sub-item'>All items</div> \
        <div class='item-count larger whisper'> \
        <span class='item-count-value' id='tree-item--4-unread-count'>" + unread + "</span> \
        </div> \
        </div>";

            $('#sub--4').prepend(entry);

            $('.open-sub-folder').unbind('click').click(function () {
                $.cookie('g2tt_feed', $(this).attr('id').substring(10));
                $.cookie('g2tt_isCat', false);
                location.reload(true);
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
                return (db_order || alpha_order);
            });
            $.each(cats, function (index, cat) {
                var entry = "<div class='row whisper sub-row closed-sub-folder" + ((cat.unread > 0) ? " unread-sub" : " no-unread-sub-row") + " nested-sub' id='tree-item-" + cat.id + "'> \
        <div class='icon-cell'> \
        <div class='icon'></div> \
        </div> \
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
    if (parent_id === '-4') {
        getTopCategories();
        return;
    }
    $('#sub-list-back').removeClass('hidden');
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
                return ((a.cat_id < b.cat_id) ? -1 : ((a.cat_id > b.cat_id) ? 1 : 0));
            });
            $('#subscriptions-list').append("<div id='sub-" + parent_id + "'></div>");

            var entry = "<div class='row whisper sub-row open-sub-folder" + ((parent_unread > 0) ? " unread-sub" : " no-unread-sub-row") + "' id='tree-item-" + parent_id + "'> \
        <div class='icon-cell'> \
        <div class='icon'></div> \
        </div> \
        <div class='text sub-item'>" + parent_title + "</div> \
        <div class='item-count larger whisper'> \
        <span class='item-count-value' id='tree-item-" + parent_id + "-unread-count'>" + parent_unread + "</span> \
        </div> \
        </div>";

            $('#sub-' + parent_id).prepend(entry);

            $.each(feeds, function (index, feed) {
                var entry = "<div class='row whisper sub-row" + ((feed.unread > 0) ? " unread-sub" : " no-unread-sub-row") + "" + ((feed.is_cat) ? " closed-sub-folder" : " sub") + " nested-sub' id='tree-item-" + feed.id + "'> \
        <div class='icon-cell'> \
        <div class='icon'></div> \
        </div> \
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

            $('.open-sub-folder').unbind('click').click(function () {
                $.cookie('g2tt_feed', $(this).attr('id').substring(10));
                $.cookie('g2tt_isCat', true);
                location.reload(true);
            });

            $('.sub').unbind('click').click(function () {
                $.cookie('g2tt_feed', $(this).attr('id').substring(10));
                $.cookie('g2tt_isCat', false);
                location.reload(true);
            });

            // Done loading
            $('body').removeClass('loading').addClass('loaded');
            $('#loading-area-container').addClass('hidden');
        });
    }
}


function getData() {
    if (typeof ($.cookie('g2tt_sid')) === 'undefined') {
        $('#main').addClass('hidden');
        $('.login').removeClass('hidden');
    } else {
        getHeadlines();
    }
}
