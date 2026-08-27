(function () {
  'use strict';

  var root = document.querySelector('[data-usage-analytics-app]');
  if (!root) return;

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
    });
  }

  function integer(value) { return new Intl.NumberFormat('en-US').format(Number(value || 0)); }
  function money(value) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value || 0)); }
  function percent(value) { return Number(value || 0).toFixed(1) + '%'; }

  function group(records, labelFor, valueFor) {
    var totals = {};
    records.forEach(function (record) {
      var label = labelFor(record) || 'Unrecorded';
      totals[label] = (totals[label] || 0) + Number(valueFor(record) || 0);
    });
    return Object.keys(totals).map(function (label) { return { label: label, value: totals[label] }; })
      .sort(function (left, right) { return right.value - left.value; });
  }

  function barChart(items, format, emptyMessage) {
    if (!items.length || !items.some(function (item) { return item.value > 0; })) {
      return '<div class="usage-empty">' + esc(emptyMessage) + '</div>';
    }
    var maximum = Math.max.apply(Math, items.map(function (item) { return item.value; }));
    return '<div class="usage-bars" role="img" aria-label="Ranked usage by provider">' + items.map(function (item) {
      var width = maximum ? Math.max(3, (item.value / maximum) * 100) : 0;
      return '<div class="usage-bar-row"><div class="usage-bar-label"><strong>' + esc(item.label) + '</strong><span>' + esc(format(item.value)) + '</span></div><div class="usage-bar-track"><span style="width:' + width.toFixed(1) + '%"></span></div></div>';
    }).join('') + '</div>';
  }

  function pieChart(items) {
    var total = items.reduce(function (sum, item) { return sum + item.value; }, 0);
    if (!total) return '<div class="usage-empty">Activity categories will appear as governed work is recorded.</div>';
    var colors = ['#137a4a', '#3078dc', '#8b5cf6', '#d97706', '#d14d72', '#4f687d'];
    var cursor = 0;
    var stops = items.map(function (item, index) {
      var start = cursor;
      cursor += (item.value / total) * 100;
      return colors[index % colors.length] + ' ' + start.toFixed(2) + '% ' + cursor.toFixed(2) + '%';
    });
    var legend = items.map(function (item, index) {
      return '<li><span style="background:' + colors[index % colors.length] + '"></span><strong>' + esc(item.label) + '</strong><small>' + percent((item.value / total) * 100) + '</small></li>';
    }).join('');
    return '<div class="usage-pie-layout"><div class="usage-pie" role="img" aria-label="Activity share by category" style="background:conic-gradient(' + stops.join(',') + ')"><div><strong>' + integer(total) + '</strong><span>activities</span></div></div><ul class="usage-pie-legend">' + legend + '</ul></div>';
  }

  function trendChart(records, useTokens) {
    var daily = {};
    records.forEach(function (record) {
      var date = String(record.occurredAt || '').slice(0, 10) || 'Unknown';
      var value = useTokens ? Number(record.tokens && record.tokens.total || 0) : 1;
      daily[date] = (daily[date] || 0) + value;
    });
    var items = Object.keys(daily).sort().map(function (date) { return { date: date, value: daily[date] }; });
    if (!items.length) return '<div class="usage-empty">The usage trend begins with the next recorded activity.</div>';
    var maximum = Math.max.apply(Math, items.map(function (item) { return item.value; })) || 1;
    var width = 640, height = 210, padding = 28;
    var points = items.map(function (item, index) {
      var x = items.length === 1 ? width / 2 : padding + index * ((width - padding * 2) / (items.length - 1));
      var y = height - padding - (item.value / maximum) * (height - padding * 2);
      return { x: x, y: y, date: item.date, value: item.value };
    });
    var path = points.map(function (point, index) { return (index ? 'L' : 'M') + point.x.toFixed(1) + ' ' + point.y.toFixed(1); }).join(' ');
    var circles = points.map(function (point) { return '<circle cx="' + point.x + '" cy="' + point.y + '" r="5"><title>' + esc(point.date + ': ' + point.value) + '</title></circle>'; }).join('');
    var labels = points.map(function (point) { return '<text x="' + point.x + '" y="202" text-anchor="middle">' + esc(point.date.slice(5)) + '</text>'; }).join('');
    return '<svg class="usage-trend" viewBox="0 0 640 210" role="img" aria-label="Usage trend by day"><path d="' + path + '"></path>' + circles + labels + '</svg>';
  }

  function render(data) {
    var workspace = window.NNOSActiveWorkspace;
    var portfolio = !workspace || workspace.id === 'founder-os';
    var usage = (data.usage.records || []).filter(function (record) { return portfolio || record.workspaceId === workspace.id; });
    var evidence = (data.evidence.records || []).filter(function (record) { return portfolio || record.workspaceId === workspace.id; });
    var totalTokens = usage.reduce(function (sum, record) { return sum + Number(record.tokens && record.tokens.total || 0); }, 0);
    var cachedTokens = usage.reduce(function (sum, record) { return sum + Number(record.tokens && record.tokens.cached || 0); }, 0);
    var requests = usage.reduce(function (sum, record) { return sum + Number(record.requests || 0); }, 0);
    var retries = usage.reduce(function (sum, record) { return sum + Number(record.optimization && record.optimization.retryCount || 0); }, 0);
    var cost = evidence.reduce(function (sum, record) { return sum + Number(record.cost && record.cost.amount || 0); }, 0) + usage.reduce(function (sum, record) { return sum + Number(record.cost && record.cost.status === 'recorded' ? record.cost.amount || 0 : 0); }, 0);
    var cacheRate = totalTokens ? (cachedTokens / totalTokens) * 100 : 0;
    var tokensByProvider = group(usage, function (record) { return record.provider; }, function (record) { return record.tokens && record.tokens.total; });
    var costByProvider = group(evidence, function (record) { return record.provider && record.provider.name; }, function (record) { return record.cost && record.cost.amount; });
    var activity = usage.map(function (record) { return { label: record.source, occurredAt: record.occurredAt, tokens: record.tokens }; })
      .concat(evidence.map(function (record) { return { label: record.eventType || 'evidence', occurredAt: record.occurredAt, tokens: { total: 0 } }; }));
    var activityMix = group(activity, function (record) { return record.label; }, function () { return 1; });
    var providerChart = totalTokens ? tokensByProvider : costByProvider;
    var highest = providerChart[0] || activityMix[0] || null;
    var highestBasis = totalTokens ? 'measured tokens' : (cost > 0 ? 'recorded cost' : 'recorded activity');
    var highestValue = !highest ? 'No measured usage yet' : totalTokens ? integer(highest.value) + ' tokens' : cost > 0 ? money(highest.value) : integer(highest.value) + ' activities';
    var coverage = data.usage.historicalCoverage || {};
    var recommendations = [];
    if (!usage.length) recommendations.push('Exact AI token collection begins with the next governed provider run.');
    if (totalTokens && cacheRate < 10) recommendations.push('Cache reuse is low; review repeated stable inputs for provider caching eligibility.');
    if (requests && retries / requests > 0.1) recommendations.push('Retries exceed 10% of requests; inspect provider and validation failures.');
    if (!recommendations.length) recommendations.push('Compact task context and duplicate-dispatch protection are active.');

    root.innerHTML = '<div class="usage-shell">' +
      '<article class="glass-panel usage-intro"><div><div class="eyebrow">Usage Analytics</div><div class="section-title">What is consuming the most usage</div><p class="muted">Project-wide measurement for AI providers, governed automation, retries, cache reuse, and recorded cost.</p></div><span class="status">Optimization active</span></article>' +
      '<div class="usage-summary"><div class="usage-stat"><span>Total tokens</span><strong>' + integer(totalTokens) + '</strong><small>Exact provider telemetry</small></div><div class="usage-stat"><span>Requests</span><strong>' + integer(requests) + '</strong><small>Governed provider calls</small></div><div class="usage-stat"><span>Cache reuse</span><strong>' + percent(cacheRate) + '</strong><small>' + integer(cachedTokens) + ' cached tokens</small></div><div class="usage-stat"><span>Retries</span><strong>' + integer(retries) + '</strong><small>Additional provider attempts</small></div><div class="usage-stat"><span>Recorded cost</span><strong>' + money(cost) + '</strong><small>Only costs explicitly recorded</small></div></div>' +
      '<article class="usage-highest" data-analytics-highest><div><div class="eyebrow">Highest measured usage</div><h2>' + esc(highest ? highest.label : 'Awaiting exact telemetry') + '</h2><p>' + esc(highest ? highest.label + ' is currently highest by ' + highestBasis + '.' : 'No provider token telemetry has been recorded yet.') + '</p></div><strong>' + esc(highestValue) + '</strong></article>' +
      '<div class="usage-chart-grid"><article class="glass-panel usage-chart-card"><div class="usage-chart-heading"><div><div class="eyebrow">Ranked comparison</div><h3>' + (totalTokens ? 'Tokens by provider' : 'Recorded cost by provider') + '</h3></div><span>' + (totalTokens ? 'Tokens' : 'USD') + '</span></div>' + barChart(providerChart, totalTokens ? integer : money, 'Provider usage will appear after an exact token or cost record is captured.') + '</article>' +
      '<article class="glass-panel usage-chart-card"><div class="usage-chart-heading"><div><div class="eyebrow">Share of activity</div><h3>Work mix</h3></div><span>Pie chart</span></div>' + pieChart(activityMix) + '</article></div>' +
      '<article class="glass-panel usage-chart-card"><div class="usage-chart-heading"><div><div class="eyebrow">Trend</div><h3>' + (totalTokens ? 'Tokens over time' : 'Recorded activity over time') + '</h3></div><span>Daily</span></div>' + trendChart(usage.length ? usage : evidence, totalTokens > 0) + '</article>' +
      '<div class="usage-bottom-grid"><article class="glass-panel"><div class="eyebrow">Optimization signals</div><h3>Recommended action</h3><ul class="usage-recommendations">' + recommendations.map(function (item) { return '<li>' + esc(item) + '</li>'; }).join('') + '</ul></article>' +
      '<article class="glass-panel"><div class="eyebrow">Measurement coverage</div><h3>' + esc(coverage.status === 'unmetered' ? 'Historical usage is preserved but unmetered' : 'Exact telemetry active') + '</h3><p class="muted">' + esc(coverage.message || 'Every future governed run records exact provider usage.') + '</p></article></div>' +
      '<details class="glass-panel usage-details"><summary>See exact usage records</summary><div class="usage-table-wrap"><table><thead><tr><th>Workspace</th><th>Provider</th><th>Model</th><th>Role</th><th>Requests</th><th>Tokens</th><th>Retries</th></tr></thead><tbody>' + (usage.length ? usage.map(function (record) { return '<tr><td>' + esc(record.workspaceId) + '</td><td>' + esc(record.provider) + '</td><td>' + esc(record.model || 'Unrecorded') + '</td><td>' + esc(record.roleId || 'Unrecorded') + '</td><td>' + integer(record.requests) + '</td><td>' + integer(record.tokens && record.tokens.total) + '</td><td>' + integer(record.optimization && record.optimization.retryCount) + '</td></tr>'; }).join('') : '<tr><td colspan="7">No exact provider usage records yet.</td></tr>') + '</tbody></table></div></details>' +
      '</div>';
  }

  function load() {
    return Promise.all([
      fetch('./registry/usage-records.json?v=fos-usage-analytics-001', { cache: 'no-store' }).then(function (response) { if (!response.ok) throw new Error('Usage registry unavailable'); return response.json(); }),
      fetch('./registry/evidence-records.json?v=fos-usage-analytics-001', { cache: 'no-store' }).then(function (response) { if (!response.ok) throw new Error('Evidence registry unavailable'); return response.json(); })
    ]).then(function (data) { render({ usage: data[0], evidence: data[1] }); }).catch(function (error) {
      root.innerHTML = '<article class="glass-panel"><div class="eyebrow">Usage Analytics</div><div class="section-title">Analytics are temporarily unavailable</div><p class="muted">' + esc(error.message) + '</p></article>';
    });
  }

  load();
  window.addEventListener('founder-os:navigation-trace', function () {
    if (document.body.getAttribute('data-active-view') === 'analytics') load();
  });
})();
