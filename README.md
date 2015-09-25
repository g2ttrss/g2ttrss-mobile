g2ttrss-mobile
==============

A Google inspired mobile interface for TT-RSS.


What is it?
-----------

This mobile-oriented webapp is a client for [Tiny Tiny RSS](http://tt-rss.org)(TT-RSS).
The webapp uses TT-RSS's [JSON API](http://tt-rss.org/redmine/projects/tt-rss/wiki/JsonApiReference).

I was a big user of Google Reader's mobile webapp and when Google announced the
end of Reader, I switched to TT-RSS. I was not satisfied with any of the other
mobile interfaces out there for TT-RSS and decided I build my own based on the
CSS styles from Google.

g2ttrss-mobile use:
 * [jQuery](http://jquery.com/)


How to use it?
--------------

You should install the files in a directory on the same host as your TT-RSS install.
As the webapp uses AJAX calls to access the API, it should be hosted on the **same domain name**.
G2TTRSS assumes that your TT-RSS install is located at `<your-domain>/tt-rss`, if this is not the case
edit `js/g2tt-config.js` and change `global_ttrssUrl` (line 2) to point to the correct location.
If the webapp is installed in a subdirectory of TT-RSS, it could be wiped on an update to TT-RSS
so after each update of TT-RSS, you may need to reinstall G2TTRSS.

Use of this webapp requires TT-RSS's external APIs. They are enabled through TT-RSS's preferences:
 * in *Tiny Tiny RSS* go into `Actions` -> `Preferences`
 * `Configuration` -> `Enable external API`


Current features
----------------

* mark all displayed as read
* categories and subcategories
* display all/new/starred/published
* view oldest/newest first
* display just a single feed
* link to the original article
* unread count display in category view
* special feeds
* star/unstar article support
* mark as read/unread article
* iPhone webapp support (startup image & icon)
* login/logout support
* load more articles (15 at a time)
* search for keywords in feeds
* Google Reader style hotkeys (`j`, `k`, `n`, `p`, `o`, `m`)

Future features are tracked as issues.

Hotkeys
-------

* `j` - Jump and expand next item.
* `k` - Jump and expand previous item.
* `n` - Jump to next item.
* `p` - Jump to previous item.
* `o` - Expand/collapse current item.
* `m` - Mark current item as read/unread.

Configuration Options
---------------------

Configuration options can be found in the js/g2tt-config.js file. These are options to change your personal preference for how the interface works.

Options:

* **global_ttrssUrl** (Default: _("/tt-rss/")_)

    The path to your TT-RSS installation relative to your domain.

* **pref_Feed** (String, default: _('-4')_, all items)

    The default feed to display. Available values:
    * >0 - A specific feed
    * 0 - Uncategorized
    * -1 - Special (e.g. Starred, Published, Archived, etc.)
    * -2 - Labels
    * -3 - All feeds, excluding virtual feeds (e.g. Labels and such)
    * -4 - All feeds, including virtual feeds

* **pref_ViewMode** (Default: _('unread')_, unread articles only)

    Show unread or all articles? Available values:
    * unread - show unread articles only
    * all - show all articles

* **pref_OrderBy** (Default: _('date_reverse')_, oldest first)

    Sort order of the articles/items. Available values:
    * date_reverse - oldest first
    * feed_dates - newest first, goes by feed date
    * (nothing) - TT-RSS's default (whatever that is)

* **pref_FeedSort** (Default: _('0')_, do not sort feeds)

    Sort the feeds (categories) in alphabetical order or not. Availables values:
    * 0 - do not sort feeds, display in the order TT-RSS returns them
    * 1 - sort the feeds in alphabetical order (A-Z)

* **pref_StartInCat** (Default: _('0')_, start showing articles)

    Start showing the feeds (categories) or articles (items)
    * 0 - start showing articles
    * 1 - start showing feeds
