# Superseded partial P1 candidate5969f8a59

All5 offline gates, original4-row reviewer probe, dist C1, assets, graph and change-protection passed on5969f8a59e8730ca4b8dd4d5900bb98babf1f6b1 (default1955, G2 5, Chromium593, G6 159). However the6-row independent coverage probe passed4/6 and reproduced two wrong-date requests. These green gates do not close P1. Current run was allowed to finish unchanged before any source edits. Runtime absolute paths in these raw artifacts refer to their original locations; files are relocated here without rewriting content.

New failures: 后天我没空，改成11月28日晚上七点 queried11/26 despite correct modeled calendarDATE; 后天还是11月28日我还没定，晚上七点 queried11/26 instead of clarifying. Root repair must prioritize a current-message-bound explicit calendar DATE over incidental relative mentions, and reject undecided/competing date selection before any automatic relative correction. No 我没空-specific patch or general calendar parser.
