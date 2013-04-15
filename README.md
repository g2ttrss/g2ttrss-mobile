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
edit `js/g2tt.js` and change `global_ttrssUrl` (line 2) to point to the correct location.
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

Future features are tracked as issues.
