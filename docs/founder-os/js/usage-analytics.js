(function () {
  'use strict';

  var root = document.querySelector('[data-usage-analytics-app]');
  if (!root) return;

  var GATEWAY = 'https://founder-os-gateway.dmoseley1024.workers.dev';
  var REFRESH_MS = 30000;
  var localData = null;
  var liveData = null;
  var liveError = null;
  var selectedRange = '7';
  var loadingLive = false;

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
    });
  }

  function integer(value) { return new Intl.NumberFormat('en-US').format(Number(value || 0)); }
  function money(value) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value || 0)); }
  function percent(value) { return Number(value || 0).toFixed(1) + '%'; }
  function clock(value) {
    var date = new Date(value);
    return isNaN(date.getTime()) ? 'Not yet' : date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' });
  }
  function duration(seconds) {
    if (seconds == null) return 'Starting';
    if (seconds < 60) return integer(seconds) + ' sec';
    var minutes = Math.floor(seconds / 60);
    return minutes < 60 ? integer(minutes) + ' min' : Math.floor(minutes / 60) + ' hr ' + (minutes % 60) + ' min';
  }

  function activeWorkspaceId() {
    return window.NNOSActiveWorkspace && window.NNOSActiveWorkspace.id ? window.NNOSActiveWorkspace.id : 'founder-os';
  }

  function group(records, labelFor, valueFor) {
    var totals = {};
    records.forEach(function (record) {
      var label = labelFor(record) || 'Unrecorded';
      totals[label] = (totals[label] || 0) + Number(valueFor(record) || 0);
    });
    return Object.keys(totals).map(function (label) { return { label: label, value: totals[label] }; })
      .sort(function (left, right) { return right.value - left.value; });
  }

  function fallbackSnapshot(data, workspaceId) {
    var portfolio = workspaceId === 'founder-os';
    var usage = (data.usage.records || []).filter(function (record) { return portfolio || record.workspaceId === workspaceId; });
    var evidence = (data.evidence.records || []).filter(function (record) { return portfolio || record.workspaceId === workspaceId; });
    var tokens = usage.reduce(function (sum, record) { return sum + Number(record.tokens && record.tokens.total || 0); }, 0);
    var cachedTokens = usage.reduce(function (sum, record) { return sum + Number(record.tokens && record.tokens.cached || 0); }, 0);
    var requests = usage.reduce(function (sum, record) { return sum + Number(record.requests || 0); }, 0);
    var retries = usage.reduce(function (sum, record) { return sum + Number(record.optimization && record.optimization.retryCount || 0); }, 0);
    var cost = evidence.reduce(function (sum, record) { return sum + Number(record.cost && record.cost.amount || 0); }, 0) + usage.reduce(function (sum, record) { return sum + Number(record.cost && record.cost.status === 'recorded' ? record.cost.amount || 0 : 0); }, 0);
    var providerRows = group(usage, function (record) { return record.provider; }, function (record) { return record.tokens && record.tokens.total; });
    var costRows = group(evidence, function (record) { return record.provider && record.provider.name; }, function (record) { return record.cost && record.cost.amount; });
    var historyMap = {};
    usage.forEach(function (record) {
      var date = String(record.occurredAt || '').slice(0, 10) || 'Unknown';
      var row = historyMap[date] || { date: date, requests: 0, tokens: 0, cachedTokens: 0, retries: 0, cost: 0, activities: 0 };
      row.requests += Number(record.requests || 0); row.tokens += Number(record.tokens && record.tokens.total || 0);
      row.cachedTokens += Number(record.tokens && record.tokens.cached || 0); row.retries += Number(record.optimization && record.optimization.retryCount || 0); row.activities += 1;
      historyMap[date] = row;
    });
    evidence.forEach(function (record) {
      var date = String(record.occurredAt || '').slice(0, 10) || 'Unknown';
      var row = historyMap[date] || { date: date, requests: 0, tokens: 0, cachedTokens: 0, retries: 0, cost: 0, activities: 0 };
      row.cost += Number(record.cost && record.cost.amount || 0); row.activities += 1; historyMap[date] = row;
    });
    var mix = usage.map(function (record) { return { label: record.source || 'provider-call' }; }).concat(evidence.map(function (record) { return { label: record.eventType || 'evidence' }; }));
    return {
      workspaceId: workspaceId, live: false, generatedAt: data.usage.updatedAt || data.evidence.updatedAt,
      historicalCoverage: data.usage.historicalCoverage || {}, active: [], alerts: [],
      summary: { tokens: tokens, cachedTokens: cachedTokens, requests: requests, retries: retries, recordedCost: cost, cacheRate: tokens ? cachedTokens / tokens * 100 : 0, byProvider: providerRows, highestUsage: providerRows[0] || null },
      history: Object.keys(historyMap).sort().map(function (date) { return historyMap[date]; }),
      activityMix: group(mix, function (record) { return record.label; }, function () { return 1; }),
      costByProvider: costRows, records: usage
    };
  }

  function barChart(items, format, emptyMessage) {
    if (!items.length || !items.some(function (item) { return item.value > 0 || item.tokens > 0; })) return '<div class="usage-empty">' + esc(emptyMessage) + '</div>';
    var normalized = items.map(function (item) { return { label: item.label, value: Number(item.value != null ? item.value : item.tokens || 0) }; });
    var maximum = Math.max.apply(Math, normalized.map(function (item) { return item.value; }));
    return '<div class="usage-bars" role="img" aria-label="Ranked usage by provider">' + normalized.map(function (item) {
      var width = maximum ? Math.max(3, item.value / maximum * 100) : 0;
      return '<div class="usage-bar-row"><div class="usage-bar-label"><strong>' + esc(item.label) + '</strong><span>' + esc(format(item.value)) + '</span></div><div class="usage-bar-track"><span style="width:' + width.toFixed(1) + '%"></span></div></div>';
    }).join('') + '</div>';
  }

  function pieChart(items) {
    var total = items.reduce(function (sum, item) { return sum + Number(item.value || 0); }, 0);
    if (!total) return '<div class="usage-empty">Activity categories will appear as governed work is recorded.</div>';
    var colors = ['#137a4a', '#3078dc', '#8b5cf6', '#d97706', '#d14d72', '#4f687d'];
    var cursor = 0;
    var stops = items.map(function (item, index) { var start = cursor; cursor += item.value / total * 100; return colors[index % colors.length] + ' ' + start.toFixed(2) + '% ' + cursor.toFixed(2) + '%'; });
    var legend = items.map(function (item, index) { return '<li><span style="background:' + colors[index % colors.length] + '"></span><strong>' + esc(item.label) + '</strong><small>' + percent(item.value / total * 100) + '</small></li>'; }).join('');
    return '<div class="usage-pie-layout"><div class="usage-pie" role="img" aria-label="Activity share by category" style="background:conic-gradient(' + stops.join(',') + ')"><div><strong>' + integer(total) + '</strong><span>activities</span></div></div><ul class="usage-pie-legend">' + legend + '</ul></div>';
  }

  function filteredHistory(history) {
    if (selectedRange === 'all') return history;
    var days = Number(selectedRange);
    var cutoff = Date.now() - days * 86400000;
    return history.filter(function (item) { var date = Date.parse(item.date + 'T23:59:59Z'); return !isNaN(date) && date >= cutoff; });
  }

  function trendChart(history, useTokens) {
    var items = filteredHistory(history || []);
    if (!items.length) return '<div class="usage-empty">No recorded history exists in this time range.</div>';
    if (items.length === 1) {
      var value = useTokens ? items[0].tokens : items[0].activities;
      return '<div class="usage-single-point"><span>One recorded day</span><strong>' + integer(value) + (useTokens ? ' tokens' : ' activities') + '</strong><small>' + esc(items[0].date) + ' · The trend line will appear after another day is recorded.</small></div>';
    }
    var maximum = Math.max.apply(Math, items.map(function (item) { return Number(useTokens ? item.tokens : item.activities) || 0; })) || 1;
    var width = 640, height = 210, padding = 28;
    var points = items.map(function (item, index) { var value = Number(useTokens ? item.tokens : item.activities) || 0; return { x: padding + index * ((width - padding * 2) / (items.length - 1)), y: height - padding - value / maximum * (height - padding * 2), date: item.date, value: value }; });
    var path = points.map(function (point, index) { return (index ? 'L' : 'M') + point.x.toFixed(1) + ' ' + point.y.toFixed(1); }).join(' ');
    var circles = points.map(function (point) { return '<circle cx="' + point.x + '" cy="' + point.y + '" r="5"><title>' + esc(point.date + ': ' + point.value) + '</title></circle>'; }).join('');
    var labels = points.map(function (point) { return '<text x="' + point.x + '" y="202" text-anchor="middle">' + esc(point.date.slice(5)) + '</text>'; }).join('');
    return '<svg class="usage-trend" viewBox="0 0 640 210" role="img" aria-label="Usage history by day"><path d="' + path + '"></path>' + circles + labels + '</svg>';
  }

  function livePanel(active) {
    if (!active.length) return '<div class="usage-live-empty"><span class="usage-live-dot"></span><div><strong>No AI task is consuming usage right now</strong><p>Founder OS will show the role, provider, elapsed time, and status here as soon as governed work starts.</p></div></div>';
    return '<div class="usage-active-list">' + active.map(function (task) { return '<article class="usage-active-item"><div><span class="usage-live-dot"></span><strong>' + esc(task.title || task.taskId) + '</strong></div><p>' + esc(task.workspaceId) + ' · ' + esc(task.role) + ' · ' + esc(task.provider) + '</p><small>' + esc(task.status) + ' · active ' + esc(duration(task.elapsedSeconds)) + '</small></article>'; }).join('') + '</div>';
  }

  function alertPanel(alerts) {
    if (!alerts.length) return '<div class="usage-alert-clear"><strong>No high-usage problems detected</strong><p>Retries, cache reuse, provider concentration, spikes, fallbacks, and long-running work are within the measured limits.</p></div>';
    return '<div class="usage-alert-list">' + alerts.map(function (alert) { return '<article class="usage-alert usage-alert--' + esc(alert.severity) + '"><div><span>' + esc(alert.severity) + '</span><strong>' + esc(alert.title) + '</strong></div><p>' + esc(alert.message) + '</p><small>' + esc(alert.recommendedAction) + '</small></article>'; }).join('') + '</div>';
  }

  function render() {
    if (!localData) return;
    var snapshot = liveData && liveData.workspaceId === activeWorkspaceId() ? liveData : fallbackSnapshot(localData, activeWorkspaceId());
    var summary = snapshot.summary || {};
    var totalTokens = Number(summary.tokens || 0), cost = Number(summary.recordedCost || 0);
    var providerChart = totalTokens ? summary.byProvider || [] : snapshot.costByProvider || [];
    var highest = providerChart[0] || null;
    var highestLabel = highest ? highest.label : 'Awaiting exact telemetry';
    var highestValue = highest ? (totalTokens ? integer(highest.tokens != null ? highest.tokens : highest.value) + ' tokens' : money(highest.value)) : 'No measured usage yet';
    var highestBasis = totalTokens ? 'measured tokens' : 'recorded cost';
    var coverage = snapshot.historicalCoverage || {};
    var records = fallbackSnapshot(localData, activeWorkspaceId()).records;
    var connectionText = snapshot.live ? 'Live · updated ' + clock(snapshot.generatedAt) : 'Snapshot · live feed unavailable';

    root.innerHTML = '<div class="usage-shell">' +
      '<article class="glass-panel usage-intro"><div><div class="eyebrow">Usage Analytics</div><div class="section-title">Live usage, history, and high-usage problems</div><p class="muted">See what is active now, how usage changes over time, and exactly what needs attention.</p></div><div class="usage-live-controls"><span class="status ' + (snapshot.live ? 'usage-connected' : 'usage-disconnected') + '"><i></i>' + esc(connectionText) + '</span><button type="button" data-usage-refresh' + (loadingLive ? ' disabled' : '') + '>' + (loadingLive ? 'Refreshing…' : 'Refresh now') + '</button></div></article>' +
      (liveError && !snapshot.live ? '<p class="usage-feed-note">Live feed could not be reached. Showing the latest preserved repository snapshot.</p>' : '') +
      '<div class="usage-summary"><div class="usage-stat"><span>Active now</span><strong>' + integer((snapshot.active || []).length) + '</strong><small>Governed tasks</small></div><div class="usage-stat"><span>Total tokens</span><strong>' + integer(totalTokens) + '</strong><small>Exact provider telemetry</small></div><div class="usage-stat"><span>Requests</span><strong>' + integer(summary.requests) + '</strong><small>Governed provider calls</small></div><div class="usage-stat"><span>Cache reuse</span><strong>' + percent(summary.cacheRate) + '</strong><small>' + integer(summary.cachedTokens) + ' cached tokens</small></div><div class="usage-stat"><span>Retries</span><strong>' + integer(summary.retries) + '</strong><small>Additional attempts</small></div><div class="usage-stat"><span>Recorded cost</span><strong>' + money(cost) + '</strong><small>Only explicit costs</small></div></div>' +
      '<div class="usage-priority-grid"><article class="glass-panel"><div class="usage-chart-heading"><div><div class="eyebrow">Real-time active usage</div><h3>What is running now</h3></div><span>' + integer((snapshot.active || []).length) + ' active</span></div>' + livePanel(snapshot.active || []) + '</article><article class="glass-panel"><div class="usage-chart-heading"><div><div class="eyebrow">High-usage problems</div><h3>What needs attention</h3></div><span>' + integer((snapshot.alerts || []).length) + ' alerts</span></div>' + alertPanel(snapshot.alerts || []) + '</article></div>' +
      '<article class="usage-highest" data-analytics-highest><div><div class="eyebrow">Highest measured usage</div><h2>' + esc(highestLabel) + '</h2><p>' + esc(highest ? highestLabel + ' is currently highest by ' + highestBasis + ' in the selected workspace.' : 'No exact provider token or cost telemetry has been recorded yet.') + '</p></div><strong>' + esc(highestValue) + '</strong></article>' +
      '<div class="usage-chart-grid"><article class="glass-panel usage-chart-card"><div class="usage-chart-heading"><div><div class="eyebrow">Ranked comparison</div><h3>' + (totalTokens ? 'Tokens by provider' : 'Recorded cost by provider') + '</h3></div><span>' + (totalTokens ? 'Tokens' : 'USD') + '</span></div>' + barChart(providerChart, totalTokens ? integer : money, 'Provider usage will appear after exact token or cost telemetry is captured.') + '</article><article class="glass-panel usage-chart-card"><div class="usage-chart-heading"><div><div class="eyebrow">Share of activity</div><h3>Work mix</h3></div><span>Pie chart</span></div>' + pieChart(snapshot.activityMix || []) + '</article></div>' +
      '<article class="glass-panel usage-chart-card"><div class="usage-chart-heading usage-history-heading"><div><div class="eyebrow">Usage history</div><h3>' + (totalTokens ? 'Tokens over time' : 'Recorded activity over time') + '</h3></div><div class="usage-range" aria-label="History range"><button type="button" data-usage-range="1" aria-pressed="' + (selectedRange === '1') + '">24h</button><button type="button" data-usage-range="7" aria-pressed="' + (selectedRange === '7') + '">7d</button><button type="button" data-usage-range="30" aria-pressed="' + (selectedRange === '30') + '">30d</button><button type="button" data-usage-range="all" aria-pressed="' + (selectedRange === 'all') + '">All</button></div></div>' + trendChart(snapshot.history || [], totalTokens > 0) + '</article>' +
      '<div class="usage-bottom-grid"><article class="glass-panel"><div class="eyebrow">Detection rules</div><h3>How problems are identified</h3><ul class="usage-recommendations"><li>Retries above 10% after at least 3 requests</li><li>Cache reuse below 10% after at least 1,000 tokens</li><li>One provider above 60% of measured tokens</li><li>Usage doubling between recorded days, fallbacks, or work active longer than 15 minutes</li></ul></article><article class="glass-panel"><div class="eyebrow">Measurement coverage</div><h3>' + esc(coverage.status === 'unmetered' ? 'Historical usage is preserved but unmetered' : 'Exact telemetry active') + '</h3><p class="muted">' + esc(coverage.message || 'Every future governed run records exact provider usage.') + '</p></article></div>' +
      '<details class="glass-panel usage-details"><summary>See exact usage history</summary><div class="usage-table-wrap"><table><thead><tr><th>Time</th><th>Workspace</th><th>Provider</th><th>Model</th><th>Role</th><th>Requests</th><th>Tokens</th><th>Retries</th></tr></thead><tbody>' + (records.length ? records.map(function (record) { return '<tr><td>' + esc(record.occurredAt || 'Unrecorded') + '</td><td>' + esc(record.workspaceId) + '</td><td>' + esc(record.provider) + '</td><td>' + esc(record.model || 'Unrecorded') + '</td><td>' + esc(record.roleId || 'Unrecorded') + '</td><td>' + integer(record.requests) + '</td><td>' + integer(record.tokens && record.tokens.total) + '</td><td>' + integer(record.optimization && record.optimization.retryCount) + '</td></tr>'; }).join('') : '<tr><td colspan="8">No exact provider usage records yet.</td></tr>') + '</tbody></table></div></details></div>';
  }

  function refreshLive() {
    if (loadingLive || !localData || document.body.getAttribute('data-active-view') !== 'analytics' || document.hidden) return Promise.resolve();
    loadingLive = true; render();
    return fetch(GATEWAY + '/v1/public/usage-analytics?workspaceId=' + encodeURIComponent(activeWorkspaceId()), { cache: 'no-store' })
      .then(function (response) { if (!response.ok) throw new Error('Live usage feed returned ' + response.status); return response.json(); })
      .then(function (data) { if (!data || !data.ok) throw new Error('Live usage feed is unavailable'); liveData = data; liveError = null; })
      .catch(function (error) { liveData = null; liveError = error; })
      .then(function () { loadingLive = false; render(); });
  }

  function load() {
    liveData = null; liveError = null;
    return Promise.all([
      fetch('./registry/usage-records.json?v=fos-usage-analytics-002', { cache: 'no-store' }).then(function (response) { if (!response.ok) throw new Error('Usage registry unavailable'); return response.json(); }),
      fetch('./registry/evidence-records.json?v=fos-usage-analytics-002', { cache: 'no-store' }).then(function (response) { if (!response.ok) throw new Error('Evidence registry unavailable'); return response.json(); })
    ]).then(function (data) { localData = { usage: data[0], evidence: data[1] }; render(); return refreshLive(); }).catch(function (error) {
      root.innerHTML = '<article class="glass-panel"><div class="eyebrow">Usage Analytics</div><div class="section-title">Analytics are temporarily unavailable</div><p class="muted">' + esc(error.message) + '</p></article>';
    });
  }

  root.addEventListener('click', function (event) {
    var refresh = event.target.closest('[data-usage-refresh]');
    var range = event.target.closest('[data-usage-range]');
    if (refresh) refreshLive();
    if (range) { selectedRange = range.getAttribute('data-usage-range') || '7'; render(); }
  });
  window.addEventListener('founder-os:navigation-trace', function () { if (document.body.getAttribute('data-active-view') === 'analytics') load(); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) refreshLive(); });
  window.setInterval(refreshLive, REFRESH_MS);
  load();
})();
