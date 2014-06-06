/**
 * Build the map navigator with specific options
 */
MapNavigator = function (holder, options) {
  // Default configuration
  var defaultConfig = {
    // Could also be "pie" chart
    mode: "choropleth",
    valueFormatter: function (value) {
      return value ? value + " %" : "";
    },
    // Highligth zones and animate
    highlight: {
      color: "#F00", // can be "none" for no fill effect
      animate: true,
      strokeWidth:1
    },
    // Could be function(value)
    hover: null,
    value: {
      display: true,
      tooltip: {
        enabled: false,
        formater: function (zoneName, label, value, percent) {
          var lbl = (label == null) ? "" : (label + "<br/>");
          var pct = (percent == null) ? "" : (" (" + Math.round(percent) + "%)");
          return "<b>" + zoneName + "</b><br/>" + lbl + value + pct;
        },
        backgroundColor: 'white',
        font: '11px Arial,Helvetica'
      },
      txt: {
        font: 'bold 12px Arial,Helvetica',
        fill: '#AAA'
      }
    },
    area: {
      defaultColor: "#ff9900",
      backgroundColor: "#eeeeee",
      lineColor: "#990099",
      label: true,
      // Support drag and drop for labels
      labelDraggable: true,
      onclick: null,
      canclick: function (zone) {
        return true;
      },
      txt: {
        font: '12px Arial,Helvetica',
        fill: '#AAA'
      },
      padding: 5
    },
    title: {
      value: 'Map',
      txt: {
        font: '18px Arial,Helvetica',
        fill: '#000'
      }
    },
    legend: {
      display: true,
      txt: {
        font: '12px Arial,Helvetica',
        fill: '#000'
      }
    },
    // Define the legend categories
    // Could also add values instead: values:[{min:, max:, text: ,color:},...] for pie, series is values:[{text:"xxx",color:""}] (same order as data)
    series: {
      n: 4, 
      useGradient:false, // if true, n is ignored
      colorA: "white",
      colorB: "blue"
    },
    exporting: {
      enabled: true,
      // Exporting scale for images, doesn't work for the moment
      scale: 1,
      url: 'http://exporting.data-publica.com/',
      icon: "M16,1.466C7.973,1.466,1.466,7.973,1.466,16c0,8.027,6.507,14.534,14.534,14.534c8.027,0,14.534-6.507,14.534-14.534C30.534,7.973,24.027,1.466,16,1.466zM16,28.792c-1.549,0-2.806-1.256-2.806-2.806s1.256-2.806,2.806-2.806c1.55,0,2.806,1.256,2.806,2.806S17.55,28.792,16,28.792zM16,21.087l-7.858-6.562h3.469V5.747h8.779v8.778h3.468L16,21.087z"
    }
  };
  // Init data
  this.holder = holder;
  this.config = MapNavigator.extend(defaultConfig, options);
  // Init colors
  if(this.config.colors == undefined) {
    this.config.colors = [
      "#3366cc",
      "#dc3912",
      "#ff9900",
      "#109618",
      "#990099",
      "#0099c6",
      "#dd4477",
      "#66aa00",
      "#b82e2e",
      "#316395",
      "#994499",
      "#22aa99",
      "#aaaa11",
      "#6633cc",
      "#e67300",
      "#8b0707",
      "#651067",
      "#329262",
      "#5574a6",
      "#3b3eac",
      "#b77322",
      "#16d620",
      "#b91383",
      "#f4359e",
      "#9c5935",
      "#a9c413",
      "#2a778d",
      "#668d1c",
      "#bea413",
      "#0c5922",
      "#743411"
    ];
  }
}

/**
 * Returns true if the map mode is "choropleth".
 */
MapNavigator.prototype.isChloro = function() {
  return this.config.mode == "choropleth";
}



/**
 * Compute series and returns the associated areas.
 */
MapNavigator.prototype.computeSeries = function(data) {
  // Init vars
  var values = [], min, max, config=this.config;
  // Find min and max values
  for(var p in data) {
    if(min == null) {
      min = data[p];
      max = data[p];
    } else {
      min = Math.min(min, data[p]);
      max = Math.max(max, data[p]);
    }
  }
  var cA = Raphael.getRGB(this.config.series.colorA);
  var cB = Raphael.getRGB(this.config.series.colorB);
  
  // if series.useGradient => only one serie with min, max, and function for color
  if (this.config.series.useGradient){
    if(typeof this.config.series.min == "number" && typeof this.config.series.max == "number") {
        min = this.config.series.min;
        max = this.config.series.max;
    }
    var f=function(v) {
        if(v < min) v = min;
        if(v > max) v = max;
            var coeff = (v - min) / (max - min);
            return Raphael.rgb(cA.r + (cB.r - cA.r) * coeff, cA.g + (cB.g - cA.g) * coeff, cA.b + (cB.b - cA.b) * coeff);
        };
    values[0] = {
            min : min,
            max : max,
            textLeft : config.valueFormatter(min),
            textRight:  config.valueFormatter(max),
            isGradient : true,
            color : f
      }; 
  } else {
      // Calculate step and min and max colors
      var step = (max - min) / this.config.series.n;
      // For each serie
      for(var i=0 ; i<this.config.series.n; i++) {
        var m = min + step * i;
        var M = min + step * (i + 1);
        var c = Raphael.rgb(cA.r + (cB.r - cA.r) * i / (this.config.series.n), cA.g + (cB.g - cA.g) * i / (this.config.series.n), cA.b + (cB.b - cA.b) * i / (this.config.series.n));
        values[i] =  {
              min: m,
              max: M,
              isGradient:false,
              text: "" + config.valueFormatter(m) + " - " + config.valueFormatter(M),
              color : c
            };
      }
  }
  // Return values
  return values;
}

/**
 * Draw the map with the given zones. The data is an associative array (zone id to value).
 */
MapNavigator.prototype.draw = function(zones, data) {
  // Init HTML element
  var element = $(this.holder);
  element.innerHTML = "";
  // Init Raphael object
  var raphael = Raphael(element[0], "100%", "100%");
  var width = element.width();
  var height = element.height();
  this.areas = raphael.set();
  this.width=width;
  this.height=height;
  // Save data
  this.map_data = data;
  // Build the popup element (for tooltip)
  element.append('<div class="_mn_tooltip"></div>');
  this.popup = element.find("._mn_tooltip");
  this.popup.css({
    position : 'absolute',
    bottom : 0,
    left : 0,
    'z-index' : 1,
    color : 'black',
    display: 'none',
    border : '1px solid black',
    'border-radius':'5px',
    padding : '5px',
    font : this.config.value.tooltip.font,
    'background-color' : this.config.value.tooltip.backgroundColor,
    opacity : 0.80
  });
  // Inject vars to use them in functionnal scope.
  var config = this.config;
  var popup = this.popup;
  var is_chloro = this.isChloro();
  this.get_data = function() {
    return this.map_data;
  }
  var get_data = this.get_data;
  // Draw the map
  this.drawMap = function(x, y, w, h, text, areas) {
    // Draw the elements to compute scaling
    var graph = raphael.set();
    // Contains everything
    var labels = raphael.set();
    graph.push(areas);
    graph.push(labels);
    for(var i=0 ; i<zones.length ; i++) {
      var area = raphael.path(zones[i].path);
      area.zone = zones[i];
      areas.push(area);
    }
    var bbox = areas.getBBox();
    var scale = Math.min(w / bbox.width, h / bbox.height);
    // Transformation computation (and center the map in the div)
    var dx = (w - scale * bbox.width) / 2;
    var dy = (h - scale * bbox.height) / 2;
    var tx = -bbox.x + dx;
    var ty = -bbox.y + dy;
    var transfo = "s" + scale + "," + scale + "," + bbox.x + "," + bbox.y + "T" + tx + "," + ty;
    // For each are
    areas.forEach(function(area) {
      // Get area config
      var id = area.zone.id;
      var attr = {
        fill : config.area.defaultColor,
        stroke : config.area.lineColor,
        "stroke-width" : 1,
        "dp-data": data[id]
      };
      area.transform(transfo).attr(attr);
      // Area Label and value
      area.zone.newCenterX = (area.zone.centerX - bbox.x) * scale + dx;
      area.zone.newCenterY = (area.zone.centerY - bbox.y) * scale + dy;
      var deltaY = (config.value.display && config.area.label ? -8 : 0);
      var lbls = raphael.set();
      // Stores the label and value
      var extraAttribute = config.area.labelDraggable ? { cursor : "move" } : {};
      if(config.area.label) {
        var areaLabel = raphael.text(area.zone.newCenterX, area.zone.newCenterY + deltaY, area.zone.name).attr(config.area.txt).attr(extraAttribute).toFront();
        deltaY += areaLabel.getBBox().height + 1;
        labels.push(areaLabel);
        lbls.push(areaLabel);
      }
      if(config.value.display && data != null) {
        if(id in data) {
          var vLabel = raphael.text(area.zone.newCenterX, area.zone.newCenterY + deltaY, config.valueFormatter(data[id])).attr(config.value.txt).attr(extraAttribute).toFront();
          labels.push(vLabel);
          lbls.push(vLabel);
        }
      }
      // Drag and drop for the labels
      var start = function() {
        lbls.oBB = lbls.getBBox();
      };
      var move = function(dx, dy) {
        var bb = lbls.getBBox();
        lbls.translate(lbls.oBB.x - bb.x + dx, lbls.oBB.y - bb.y + dy);
      }
      if(config.area.labelDraggable) {
        lbls.drag(move, start);
      }
      // tooltip
      if (is_chloro && config.value.tooltip.enabled) {
        area.mouseover(function(event) {
          var value = area.attrs["dp-data"];
          if(value) {
            if(!popup.is(":visible") || popup.attr("zone")!=area.zone.id) {
              var parentOffset = element.offset();
              popup.show();
              // Get formatted value
              var formatted = config.valueFormatter(value);
              // stores zone id in popup
              popup.attr("zone",area.zone.id);
              popup.html(config.value.tooltip.formater(area.zone.name, null, formatted, null));
              var bbox = area.getBBox();
              popup.css({
                left: bbox.x2 - (bbox.x2-bbox.x)/2,
                bottom:  element.height() - bbox.y + 10
              });
            }
          }
        });
        area.mouseout(function(event) {
            if(!area.isPointInside( event.offsetX, event.offsetY))
                popup.hide();
        });
      }
      // Events
      area.hover(function() {
        if(config.hover != null) {
          config.hover(area.zone);
        }
        area.animate({ "stroke-width" : 3 }, 200);
      }, function() {
        if(config.hover != null) {
          config.hover(null);
        }
        area.animate({ "stroke-width" : 1 }, 200);
      });
      //
      if(typeof config.area.onclick == 'function') {
        area.click(function() {
          if(config.area.canclick(area.zone, area.attrs["dp-data"])) {
            config.area.onclick(area.zone, element[0].id);
          }
        });
        area.node.style.cursor = (config.area.canclick(area.zone, area.attrs["dp-data"])) ? "pointer" : "default";
      }
    });
    // Move to the right x,y position
    graph.transform("...T" + x + "," + y);
  }
  
  this.clickHandler = function(zone) {
    
  }

  /**
   * Color the zones with data values
   */
  this.colorZones = function(areas, seriesValues) {
    var mdata = this.get_data();
    var config = this.config;
    areas.forEach(function(area) {
      var id = area.zone.id;
      var fillColor = config.area.defaultColor;
      if(mdata != null && id in mdata) {
         // by default this is the max color
        var serie = seriesValues[seriesValues.length-1];
        fillColor = serie.isGradient?serie.color(mdata[id]):serie.color;
        for(var j=0 ; j<seriesValues.length ; j++) {
           serie = seriesValues[j];
          if((mdata[id] >= serie.min) && (mdata[id] < serie.max)) {
            fillColor = serie.isGradient?serie.color(mdata[id]):serie.color;
            break;
          }
        }
      }
      area.attrs.color = fillColor;
      area.attrs["dp-data"] = mdata[id];
      area.attr({
        fill : fillColor
      });
      //
      area.node.style.cursor = (config.area.canclick(area.zone, area.attrs["dp-data"])) ? "pointer" : "default";
    });
  };

    /**
     * Draw a simple pie chart
     */
    function pieChart(cx, cy, r, values, serieValues, zoneName) {
        var rad = Math.PI / 180, chart = raphael.set();
        function sector(cx, cy, r, startAngle, endAngle, params) {
            var x1 = cx + r * Math.cos(-startAngle * rad), x2 = cx + r * Math.cos(-endAngle * rad), y1 = cy + r * Math.sin(-startAngle * rad), y2 = cy + r * Math.sin(-endAngle * rad);
            return raphael.path(["M", cx, cy, "L", x1, y1, "A", r, r, 0, +(endAngle - startAngle > 180), 0, x2, y2, "z"]).attr(params);
        }

        var angle = 0, total = 0, process = function(j) {
            var value = values[j];
            if (value == 0)
                return;
            var angleplus = 360 * value / total;
            var popangle = angle + (angleplus / 2);
            var delta = 30;
            var p = sector(cx, cy, r, angle, angle + angleplus, {
                fill : serieValues[j].color,
                "stroke-width" : 1
            });
            if (config.value.tooltip.enabled) {
                p.mouseover(function(event) {
                    if (!popup.is(":visible")) {
                        popup.show();
                        var parentOffset = p.getBBox();
                        console.log(p);
                        popup.html(config.value.tooltip.formater(zoneName, serieValues[j].text, value, (value / total * 100)));
                        popup.css({
                            left : event.pageX - parentOffset.left + 20,
                            top : event.pageY - parentOffset.top
                        });
                    }
                });
                p.mouseout(function(event) {
                    popup.hide();
                });
            }
            angle += angleplus;
            chart.push(p);
        };
        for (var i = 0, ii = values.length; i < ii; i++) {
            total += values[i];
        }
        for ( i = 0; i < ii; i++) {
            process(i);
        }
        // some life
        chart.mouseover(function() {
            chart.stop().animate({
                transform : "s1.3 1.3 " + cx + " " + cy
            }, 500, "elastic");
        }).mouseout(function() {
            chart.stop().animate({
                transform : ""
            }, 500, "elastic");
        });
        return chart;
    };

    function drawPies(x, y, areas, seriesValues) {
        // Compute Size of pie: we make this size fixed but we could also make it proportionnal to sum of pie sector values.
        var points = [];
        areas.forEach(function(area) {
            points.push([area.zone.newCenterX, area.zone.newCenterY]);
        });

        var pieRadius = MapNavigator.closestPair(points).distance / 2.1;

        areas.forEach(function(area) {
            var id = area.zone.id;
            // color in the series
            if (data != null && id in data) {
                pieChart(area.zone.newCenterX + x, area.zone.newCenterY + y, pieRadius, data[area.zone.id], seriesValues, area.zone.name);
            }

        });
    }

   this.drawLegend = function(series) {
        if(this.labels) {
          this.labels.remove();
        }
        this.labels = raphael.set();
        var txt;
        var hMargin = 5;
        var vMargin = 10;
        var h = vMargin;
        // draw the legend
        for (var i = 0; i < series.length; i++) {
            var serie=series[i];
            var widthRect=serie.isGradient?200:10;
            var c=serie.isGradient?("0-"+serie.color(serie.min)+"-"+serie.color(serie.max)):serie.color;
            this.labels.push(raphael.rect(hMargin, h, widthRect, 10, 1).attr({
                fill : c,
                stroke : "none"
            }));
            if (serie.isGradient){
                this.labels.push( txtL = raphael.text(hMargin-3, h + 6, serie.textLeft).attr(config.legend.txt).attr({
                    "text-anchor" : "end"
                }));
                txtL.node.style["textAnchor"] = "end";
                this.labels.push( txt = raphael.text(hMargin + widthRect+5, h + 6, serie.textRight).attr(config.legend.txt).attr({
                    "text-anchor" : "end"
                }));
                txt.node.style["textAnchor"] = "start";
            } else{
                this.labels.push( txt = raphael.text(hMargin + widthRect+5, h + 6, serie.text).attr(config.legend.txt).attr({
                    "text-anchor" : "start"
                }));
                txt.node.style["textAnchor"] = "start";
            }
            h += txt.getBBox().height * 1.2;
        }
        // position the legend
        var bb = this.labels.getBBox();
        this.labels.translate([this.width - bb.width - 2 * hMargin, this.height - bb.height - 2 * vMargin]);
        return this.labels;
    }

    

    // clear and draw background color
    raphael.clear();
    var padding = config.area.padding;
    raphael.rect(0, 0, width, height).attr({
        fill : config.area.backgroundColor,
        'stroke-width' : 0
    }).toBack();

    // Title text
    var title;
    var titleHeight = 0;
    if (config.title.value) {
        title = raphael.text(width / 2, 0, config.title.value).attr(config.title.txt);
        title.translate(0, title.getBBox().height / 2);
        if (title.getBBox().width > (width - 2 * padding))
            title.scale((width - 2 * padding) / title.getBBox().width);
        titleHeight = title.getBBox().height;
    }

    // Compute series if necessary
    var seriesValues = config.series.values;
    if (data != null && this.isChloro() && seriesValues == null)
        seriesValues = this.computeSeries(data);

    var mapX = padding;
    var mapY = titleHeight + padding;
    var mapWidth = width - 2 * padding;
    var mapHeight = height - 2 * padding - titleHeight;

    // draw legend
    if(config.legend.display) {
      var legendBB = this.drawLegend(seriesValues).getBBox();
      if (config.series.useGradient){
          mapHeight=mapHeight-height+legendBB.y - 2 * padding
      } else
          mapWidth = legendBB.x - 2 * padding;
    }
    


    // drawMap
    this.drawMap(mapX, mapY, mapWidth, mapHeight, title, this.areas);

    // Draw Data
    if (this.isChloro()) {
        this.colorZones(this.areas, seriesValues);
    } else {
        drawPies(mapX, mapY, this.areas, seriesValues);
    }

    // Export Icon and export function
    if (config.exporting.enabled) {
        var icon = raphael.path(config.exporting.icon).attr({
            fill : "#000",
            stroke : "none",
            opacity : 0.5
        }).transform("s0.6T" + (width - 30) + ",0");
        var bb = icon.getBBox();
        var sensibleZone = raphael.rect(bb.x, bb.y, bb.width, bb.height).attr({
            fill : "#000",
            opacity : 0
        });
        sensibleZone.hover(function() {
            icon.stop().animate({
                opacity : 1
            }, 200);
        }, function() {
            icon.stop().attr({
                opacity : 0.5
            });
        });
        sensibleZone.node.style.cursor = "pointer";

        sensibleZone.click(function() {
            // create a form and submit it
            icon.hide();
            // Cleanup SVG:
            // (issue with stroke-width)
            // (font)
            var svg = raphael.toSVG();
            svg = svg.replace(/stroke-width="1"/g, 'stroke-width="' + (1 / scale) + '"');
            svg = svg.replace(/height="100%"/, 'height="100%"  viewBox="0 0 ' + width + ' ' + height + '"');

            var form = $('<form>', {
                'action' : config.exporting.url,
                method : 'post'
            }).append($('<input>', {
                'name' : 'svg',
                'value' : svg,
                'type' : 'hidden'
            })).append($('<input>', {
                'name' : 'width',
                'value' : config.exporting.scale * width,
                'type' : 'hidden'
            })).append($('<input>', {
                'name' : 'height',
                'value' : config.exporting.scale * height,
                'type' : 'hidden'
            })).append($('<input>', {
                'name' : 'type',
                'value' : 'image/png',
                'type' : 'hidden'
            })).append($('<input>', {
                'name' : 'filename',
                'value' : config.title.value ? config.title.value.replace(' ', '_') : 'map',
                'type' : 'hidden'
            }));

            // following line is needed in Firefox/IE
            form.appendTo($('body'));
            form.submit();
            //console.log(svg);
            icon.show();

        });
    }
}
/**
 * Highlight zones given array of zone ids
 * @param {Object} zones
 */
MapNavigator.prototype.highlight = function(zones) {
    var config = this.config;
    var transfo;

    // unhighlight the previews zones
    this.unhighlight();
    var highlighted = new Array();
    // hightlight the new zones;
    this.areas.forEach(function(e) {
        var id = e.zone.id;
        zones.forEach(function(s) {
            if (id == s) {
                e.toFront();
                highlighted.push(e);
                var attrs={};
                if (config.highlight.color!="none")
                    attrs.fill=config.highlight.color;
                if (config.highlight.animate) {
                    attrs.transform ="...S1.25";
                    e.stop().animate(attrs, 200, '>', function() {
                        e.animate({
                            transform : "...S0.8"
                        }, 200, '<');
                    });
                } else
                    e.animate(attrs, 200, 'elastic');
               e.attr({"stroke-width" :  config.highlight.strokeWidth});
               e.attrs.oldWith=e.attrs["stroke-width"];
            }
        });
    });
    this.highlighted = highlighted;
}
/**
 * unhighlight the highlighted zones
 */
MapNavigator.prototype.unhighlight = function() {
    var config = this.config;
    //
    if (this.highlighted != null) {
        this.highlighted.forEach(function(s) {
            s.animate({
                fill : s.attrs.color
            }, 400);
           s.attr({"stroke-width" :  1});
        });
    }
}

MapNavigator.prototype.recolor = function(data) {
  this.map_data = data;
  var series = this.computeSeries(data);
  if(this.config.legend.display) {
    this.drawLegend(series);
  }
  this.colorZones(this.areas, series);
}


/* ********** UTILITIES ********** */

Array.max = function(array) {
    return Math.max.apply(Math, array);
};

Array.min = function(array) {
    return Math.min.apply(Math, array);
};

/**
 * Find the closest pair of points in a set of [[x,y]...] coordinates
 * We use brute force O(n2) algorithm and this could be better (see http://en.wikipedia.org/wiki/Closest_pair_problem)
 * @param [[x,y]..] points
 * @return  {distance : minDist, points : minPoints}
 */
MapNavigator.closestPair = function(points) {
    function distance2(p1, p2) {
        var dx = p1[0] - p2[0];
        var dy = p1[1] - p2[1];
        return dx * dx + dy * dy;
    }

    if (points.length < 2) {
        return Infinity;
    } else {
        var minDist2 = distance2(points[0], points[1]);
        var minPoints = points.slice(0, 2);
        for (var i = 0; i < points.length - 1; i++) {
            for (var j = i + 1; j < points.length; j++) {
                var d = distance2(points[i], points[j]);
                if (d < minDist2) {
                    minDist2 = d;
                    minPoints = [points[i], points[j]];
                }
            }
        }
        return {
            distance : Math.sqrt(minDist2),
            points : minPoints
        };
    }
}

/**
 * Adapted from jQuery.
 */
MapNavigator.extend = function() {
  // Copy reference to target object
  var length = arguments.length, options, target = arguments[0];
  // For each entry
  for (var i=1; i<length; i++)
    // Only deal with non-null/undefined values
    if((options = arguments[i]) != null) {
      // Extend the base object
      for(var name in options) {
        var src = target[name], copy = options[name];
        // Prevent never-ending loop
        if(target === copy) {
          continue;
        }
        // Recurse if we're merging object values
        if(copy && typeof copy === "object" && !copy.nodeType) {
          // Never move original objects, clone them
          target[name] = MapNavigator.extend(src || (copy.length != null ? [] : {}), copy);
        // Don't bring in undefined values
        } else if (copy !== undefined) {
          target[name] = copy;
        }
      }
    }
    // Return the modified object
    return target;
};