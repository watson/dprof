/*eslint-env browser */

(function (dump, d3) {
  // Get elements
  var info = d3.select('#info');
  var ticks = d3.select('#ticks');
  var content = d3.select('#content');

  // Settings
  var timeScale = 1e9; // seconds
  var timelineHeight = 20;

  // Setup scale
  var xScale = d3.scale.linear()
    .range([10, window.innerWidth - 10])
    .domain([0, dump.total / timeScale]);

  var xFormat = xScale.tickFormat();
  var xAxis = d3.svg.axis()
      .scale(xScale)
      .orient('top')
      .tickFormat(function (d) { return (d ? xFormat(d) : '0'); });

  ticks.append('g')
    .attr('class', 'x axis')
    .attr('transform', 'translate(0, 24)')
    .call(xAxis);

  window.addEventListener('resize', function () {
    xScale.range([10, window.innerWidth - 10]);
    ticks.select('.x.axis').call(xAxis);
  });

  // Flatten datastructure
  function Flatten(data) {
    this.nodes = [];
    this.total = data.total / timeScale;
    this.insert(null, data.root);
  }

  function Node(parent, node, index) {
    // Meta
    this.index = index; // related to top position
    this.id = index; // d3 id, doesn't change
    this.parent = parent;

    // Info
    this.name = node.name;
    this.stack = node.stack;

    // Position
    this.init = node.init / timeScale;
    this.before = node.before / timeScale;
    this.after = node.after / timeScale;
    this.top = this.index * timelineHeight + timelineHeight / 2;
  }

  Flatten.prototype.insert = function (parent, node) {
    var struct = new Node(parent, node, this.nodes.length);
    this.nodes.push(struct);
    node.children.forEach(this.insert.bind(this, struct));
  };

  Flatten.prototype.totalHeight = function () {
    return this.nodes[this.nodes.length - 1].top + timelineHeight / 2;
  };

  var flatten = new Flatten(dump);

  function draw() {
    // Update content height
    content.style('height', flatten.totalHeight());

    // Insert data dump
    var bar = content
      .selectAll('g')
        .data(flatten.nodes, function (d) { return d.id; });
    var barEnter = bar
      .enter().append('g')
        .attr('class', 'timeline');

    barEnter.append('path')
      .attr('class', function (d, i) {
        return 'background ' + (i % 2 ? 'even' : 'odd');
      })
      .attr('d', backgroundPath);
    function backgroundPath(d) {
      return `M${xScale(0)} ${d.top}` + // Move to
             `H${xScale(flatten.total)}`; // Horizontal line to
    }

    barEnter.filter(function(d) { return d.parent; }).append('path')
        .attr('class', 'init')
        .attr('d', initPath);
    function initPath(d) {
      // Add half after to top1. Add haft befor before top2
      return `M${xScale(d.init) - 1} ${d.parent.top + 6}` + // Move to
             `V${d.top + 3}`; // Vertical line to
    }

    barEnter.append('path')
        .attr('class', 'before')
        .attr('d', beforePath);
    function beforePath(d) {
      return `M${xScale(d.init)} ${d.top}` + // Move to
             `H${xScale(d.before)}`; // Horizontal line to
    }

    barEnter.append('path')
        .attr('class', 'after')
        .attr('d', afterPath);
    function afterPath(d) {
      return `M${xScale(d.before)} ${d.top}` + // Move to
             `H${xScale(d.after)}`; // Horizontal line to
    }
  }
  draw();

  window.addEventListener('resize', function () {
    draw();
  });

})(window.datadump, window.d3);