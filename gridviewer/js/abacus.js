function abacus() {
    /*
     * Private Variables
     */
    var data, fields, rows
      , side = 14 // length of each cell square
      , label_rotation = -90
      , brushcolor = "lightgreen"
      , tip = d3.tip().attr("class", "d3-tip")
      , master = {
              canvas: null
            , overlay: {}
            , width: 0
            , height: 0
            , indexbyname: {}
            , namebyindex: {}
            , scale: {}
          } // the shadow grid (the drawing)
      , matrix = { // main display (the interactive)
              canvas: null
            , overlay: {} // svg axes, brush component and tooltip
            , width: 0
            , height: 0
            , margin: { top: 100, right: 50, bottom: 10, left: 100 }
            , scale: {}
            , axis: {}
            , viewport: {} // in domain scale
            , brush: d3.brush()
          }
      , minimap = { // overview display
              canvas: null
            , overlay: {}
            , width: 0
            , height: 0
            , scale: {}
            , zoom: {}
            , brush: d3.brush()
          }
      , dataset = {
              grid: []
            , extent: [[0,0], [0,0]] // of selected/brushed data
          }
      , dispatch = d3.dispatch("selected")
      , send = true // whether or not to dispatch the selected data
      , dom // dom node that holds all of this stuff
    ;
    /*
     * Main Function object
     */
    function widget(sel) {
        dom = sel;
        data = dom.datum()
            .sort(function(a, b) {
                return d3.ascending(+a.Year, +b.Year) || d3.ascending(a.State, b.State);
              })
        ;
        rows = data.map(function(d) { return d.Identifier; });
        fields = d3.keys(data[0]);

        processDataSet();
        setupMaster();
        setupMatrix();
        setupMinimap();

        panned(); // align the minmap and matrix together.
        draw();
    } // widget() -- main function object

    function processDataSet() {
        // Set boundaries based on data (needed to process the data)
        master.indexbyname.x = d3.scaleOrdinal()
            .domain(fields)
            .range(d3.range(fields.length))
        ;
        master.indexbyname.y = d3.scaleOrdinal()
            .domain(rows)
            .range(d3.range(data.length))
        ;
        master.namebyindex.x = d3.scaleOrdinal()
            .domain(master.indexbyname.x.range())
            .range(master.indexbyname.x.domain())
        ;
        master.namebyindex.y = d3.scaleOrdinal()
            .domain(master.indexbyname.y.range())
            .range(master.indexbyname.y.domain())
        ;
        // Now the data can be processed
        dataset.grid = [];
        data.forEach(function(d, i) {
            fields.forEach(function(f, j) {
                if(d[f]) dataset.grid.push({ x: j * side, y: i * side });
              })
            ;
          })
        ;
    } // processDataSet()

    function setupMaster() {
        master.width  = (side * fields.length);
        master.height = (side * rows.length);

        master.scale.x = d3.scaleLinear()
            .domain(d3.extent(master.indexbyname.x.range()))
            .rangeRound(d3.extent(master.indexbyname.x.range()).map(function(d) {
                return d * side;
              }))
            .clamp(true)
        ;
        master.scale.y = d3.scaleLinear()
            .domain(d3.extent(master.indexbyname.y.range()))
            .rangeRound(d3.extent(master.indexbyname.y.range()).map(function(d) {
                return d * side;
              }))
            .clamp(true)
        ;
        master.canvas = d3.select(document.createElement("canvas"))
          .append("canvas")
            .attr("width", master.width)
            .attr("height", master.height)
          .node()
        ;
        ["laws", "brushed"]
            .forEach(function(c) {
                master.overlay[c] = d3.select(document.createElement("canvas"))
                  .append("canvas")
                    .attr("width", master.width)
                    .attr("height", master.height)
                  .node()
                ;
              })
        ;
    } // setupMaster()

    function sizeMatrix(sel) {
        var w = parseInt(sel.style("width")) - matrix.margin.left
          , h = parseInt(sel.style("height")) - matrix.margin.top
        ;
        matrix.viewport.width = Math.floor(master.scale.x.invert(w));
        matrix.viewport.height = Math.floor(master.scale.y.invert(h));
        matrix.width = Math.min(
              master.width
            , master.scale.x(matrix.viewport.width)
          )
        ;
        matrix.height = Math.min(
              master.height
            , master.scale.y(matrix.viewport.height)
          )
        ;
    } // sizeMatrix()

    function setupMatrix() {
        var grid = dom.select("#magnifier").call(sizeMatrix);
        matrix.canvas = grid
          .append("canvas")
            .attr("width", matrix.width)
            .attr("height", matrix.height)
            .style("margin-top", matrix.margin.top + "px")
            .style("margin-left", matrix.margin.left + "px")
        ;
        var svg = grid
          .append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .call(tip)
        ;
        matrix.overlay = svg
          .append("g")
            .attr("transform", "translate(" +
                  matrix.margin.left + "," + matrix.margin.top +
                ")"
              )
        ;
        matrix.scale.x = d3.scaleLinear()
            .domain(master.scale.x.domain())
            .range([0, matrix.width])
        ;
        matrix.axis.x = d3.axisTop()
            .scale(matrix.scale.x)
            .tickPadding(0)
        ;
        matrix.overlay
          .append("g")
            .attr("class", "fields x axis")
        ;
        matrix.scale.y = d3.scaleLinear()
            .domain(master.scale.y.domain())
            .range([0, matrix.height])
        ;
        matrix.axis.y = d3.axisLeft()
            .scale(matrix.scale.y)
            .tickPadding(0)
        ;
        matrix.overlay
          .append("g")
            .attr("class", "state-year y axis")
        ;
        // matrix.brush
        //     .x(matrix.scale.x)
        //     .y(matrix.scale.y)
        //   .on("brush", brushed)
        //   .on("brushend", brushend)
        // ;
        // matrix.overlay
        //   .append("g")
        //     .attr("class", "brush")
        //     .call(matrix.brush)
        // ;
    } // setupMatrix()

    function setupMinimap() {
        var container = dom.select("#navigator");
        minimap.width = parseInt(container.style("width"));
        minimap.zoom.x = minimap.width / master.width;
        minimap.height = minimap.zoom.x * master.height;
        minimap.zoom.y = minimap.height / master.height;

        minimap.canvas = container
          .append("canvas")
            .attr("width", master.width)
            .attr("height", master.height)
            .style("width", minimap.width)
            .style("height", minimap.height)
            .style("transform-origin", "top left")
            .style("transform", "scale(" + (minimap.width / master.width) + ")")
        ;
        minimap.overlay = container
          .append("svg")
            .attr("width", minimap.width)
            .attr("height", minimap.height)
        ;
        // Add one to the domain, because d3's brush extent excludes the max
        minimap.scale.x = d3.scaleLinear()
          .domain([master.scale.x.domain()[0], master.scale.x.domain()[1] + 1])
          .range([0, minimap.width])
        ;
        minimap.scale.y = d3.scaleLinear()
          .domain([master.scale.y.domain()[0], master.scale.y.domain()[1] + 1])
          .range([0, minimap.height])
        ;
        // minimap.brush
        //     .x(minimap.scale.x)
        //     .y(minimap.scale.y)
        //     .clamp([true, true])
        //     .extent([
        //           [0, 0]
        //         , [matrix.viewport.width, matrix.viewport.height]
        //       ])
        //   .on("brush", pan)
        //   .on("brushend", panned)
        // ;
        // minimap.overlay
        //   .append("g")
        //     .attr("class", "brush")
        //     .call(minimap.brush)
        //     .call(minimap.brush.event)
        // ;
    } // setupMinimap()

    /*
     * Helper Functions
     */
    function drawAxes() { /* Render the axes */
        matrix.overlay.select(".x.axis")
            .call(
                matrix.axis.x
                    .scale(matrix.scale.x)
                    .tickValues(d3.range(
                        matrix.scale.x.domain()[0], matrix.scale.x.domain()[1]
                      ))
                    .tickSize(-matrix.height, 0, 0)
              )
          .selectAll(".tick text")
            .attr("transform", "rotate(" + label_rotation + ")")
            .attr("x", 9)
            .attr("y", side / 2)
            .attr("dy", ".35em")
            .style("text-anchor", "start")
            .text(function(t) { return master.namebyindex.x(t); })
            .classed("brushed", function(d) {
                return d >= dataset.extent[0][0] && d < dataset.extent[1][0];
              })
            .on("mouseover", function() {
                var self = d3.select(this);
                self.style("text-decoration", "underline overline");
                tip
                  .direction('s')
                  .offset([self.node().getBBox().width / 2, 0])
                  .html(tiptext(self))
                  .show()
                ;
              })
        ;
        matrix.overlay.select(".y.axis")
            .call(matrix.axis.y
                .scale(matrix.scale.y)
                .tickValues(d3.range(
                    matrix.scale.y.domain()[0], matrix.scale.y.domain()[1]
                  ))
                .tickSize(-matrix.width, 0, 0)
              )
          .selectAll("text")
            .attr("y", side / 2)
            .attr("dy", ".35em")
            .text(function(t) { return master.namebyindex.y(t); })
            .classed("brushed", function(d) {
                return d >= dataset.extent[0][1] && d < dataset.extent[1][1];
              })
            .on("mouseover", function() {
                var self = d3.select(this);
                self.style("text-decoration", "underline overline");
                tip
                  .direction('se')
                  .offset([0,0])
                  .html(tiptext(self))
                  .show()
                ;
              })
        ;
        matrix.overlay.selectAll(".axis text")
            .on("mouseout", function() {
                d3.select(this).style("text-decoration", "none");
                tip.hide();
              })
        ;

        function tiptext(self) {
            return "<span"
                + (self.classed("brushed") ? " style='color: #2a93cc'" : "")
                + ">"
                + self.text()
                + "</span>"
            ;
        } // tiptext()
    } // drawAxes()

    function drawCanvases() {
        var context = master.canvas
            .getContext('2d', {preserveDrawingBuffer: true})
        ;
        context.clearRect(0, 0, master.width, master.height);
        context.fillStyle = "#eee";
        context.fillRect(0, 0, master.width, master.height);

        dataset.grid.forEach(function(c) {
            context.fillStyle = brushcolor;
            context.fillRect(c.x, c.y, side, side);
          })
        ;
    } // drawCanvases()

    function updateCanvases() {
        // Show the laws
        var context = master.overlay.laws
            .getContext('2d', {preserveDrawingBuffer: true})
        ;
        context.clearRect(0, 0, master.width, master.height);
        // Show the brushed region
        var x = dataset.extent.map(function(e) { return e[0]; })
          , y = dataset.extent.map(function(e) { return e[1]; })
        ;
        context = master.overlay.brushed
            .getContext('2d', {preserveDrawingBuffer: true})
        ;
        context.clearRect(0, 0, master.width, master.height);
        context.fillStyle = rgba(brushcolor, 0.4);
        context.fillRect(
              master.scale.x(x[0])
            , master.scale.y(y[0])
            , master.scale.x(x[1] - x[0])
            , master.scale.y(y[1] - y[0])
          )
        ;
        // Utility function
        function rgba(color, opacity) {
            var rgb = d3.rgb(color);
            return 'rgba('
              + rgb.r + ',' + rgb.g + ',' + rgb.b + ','
              + (opacity ? '0.5' : '0.9')
              +')'
            ;
        } // rgba()
    } // updateCanvases()

    function renderCanvases() {
        var pic = matrix.canvas.node()
                .getContext('2d', {preserveDrawingBuffer: true})
          , thumb = minimap.canvas.node()
                  .getContext('2d', {preserveDrawingBuffer: true})
        ;
        [master.canvas, master.overlay.laws, master.overlay.brushed]
            .forEach(function(source) {
                pic.drawImage(source
                    , -master.scale.x(matrix.scale.x.domain()[0])
                    , -master.scale.y(matrix.scale.y.domain()[0])
                  )
                ;
                thumb.drawImage(source, 0, 0);
              })
        ;
    } // renderCanvases()

    function draw() {
        drawCanvases();
        drawAxes();
        update();
    } // draw()

    function update() {
        updateCanvases();
        renderCanvases();
    } // updateGrid()

    /*
     * Callback functions for the brushes
     *  - brushed() and brushend() are for the matrix brush
     *  - panned() is for the minimap brush
     */
    function brushed() {
        dataset.extent = matrix.brush.extent()
            .map(function(e) {
                return e.map(function(c) { return Math.round(c); });
              })
        ;
        d3.select(this).call(matrix.brush.extent(dataset.extent));
        drawAxes();
        update();
    } // brushed()

    function brushend() {
        var ret = []
          , x = dataset.extent.map(function(e) { return e[0]; })
          , y = dataset.extent.map(function(e) { return e[1]; })
        ;
        d3.range(x[0], x[1]).forEach(function(i) {
            d3.range(y[0], y[1]).forEach(function(j) {
                ret.push({
                      i: i
                    , j: j
                  })
                ;
              })
            ;
          })
        ;
        if(send) // only need to send if the selection has changed.
            dispatch.selected(ret);
    } // brushend()

    function pan() {
        send = false;
        var extent = minimap.brush.extent()
          , y = extent[0][1]
          , x = extent[0][0]
          , x1 = minimap.scale.x.domain()[1]
          , y1 = minimap.scale.y.domain()[1]
        ;
        if(minimap.brush.empty() || (d3.event && d3.event.mode === "resize")) {
            extent = [
                  [x - matrix.viewport.width/2, y - matrix.viewport.height/2]
                , [x + matrix.viewport.width/2, y + matrix.viewport.height/2]
              ]
            ;
        }
        if(extent[0][0] < 0) {
            extent[0][0] = 0;
            extent[1][0] = matrix.viewport.width;
        } else if(extent[1][0] > x1) {
            extent[1][0] = x1;
            extent[0][0] = x1 - matrix.viewport.width;
        }

        if(extent[0][1] < 0) {
            extent[0][1] = 0;
            extent[1][1] = matrix.viewport.height;
        } else if(extent[1][1] > y1) {
            extent[1][1] = y1;
            extent[0][1] = y1 - matrix.viewport.height;
        }

        extent = extent.map(function(e) { return e.map(Math.round); });
        minimap.overlay.select(".brush")
            .call(minimap.brush.extent(extent))
        ;
        matrix.scale.x
            .domain(extent.map(function(e) { return e[0]; }))
        ;
        matrix.scale.y
            .domain(extent.map(function(e) { return e[1]; }))
        ;
        drawAxes();
        update();
    } // pan()

    function panned() {
        // Offset the brush
        // matrix.overlay.select(".brush")
        //     .call(matrix.brush
        //           .x(matrix.scale.x)
        //           .y(matrix.scale.y)
        //         )
        //     .call(matrix.brush.event)
        // ;
        send = true;
        drawAxes();
        update();
    } // panned()

    /*
     * API (Getters/Setters)
     */
    widget.dispatch = function() {
        return dispatch;
      } // widget.dispatch()
    ;
    widget.selected = function() {
        return dataset.extent;
      } // widget.dataset.selected
    ;
    widget.showRole = function(role, color) {
        highlight.set(role, color);

        return widget;
      } // widget.showRole()
    ;
    widget.hideRole = function(role) {
        if(!arguments.length)
            return widget;

        if(highlight.has(role)) {
            highlight.remove(role);
        }
        return widget;
      } // widget.hideRole()
    ;
    widget.data = function(arg) {
        if(!arguments.length)
            return widget;

        processDataSet(arg);
        return widget;
      } // widget.data()
    ;
    widget.update = function() {
        update();

        return widget;
      } // update()
    ;
    widget.resize = function() {
        d3.select(matrix.canvas.node().parentNode).call(sizeMatrix);

        /* top-left corner is the reference point */
        matrix.scale.x
            .domain([x0, x1])
            .range([0, matrix.width])
        ;
        matrix.scale.y
            .domain([y0, y1])
            .range([0, matrix.height])
        ;
        matrix.canvas
            .attr("width", matrix.width)
            .attr("height", matrix.height)
        ;
        minimap.overlay.select(".brush")
            .call(
                  minimap.brush.extent([
                    [0, 0]
                  , [matrix.viewport.width, matrix.viewport.height]
                ])
              )
        ;
        pan();
        panned();
        return widget;
      } // widget.resize()
    ;
     // main function object is ALWAYS the last thing returned
    return widget;
} // abacus()
