// COLOURS
var nodeColourGoals01 = '#e5243b';
var nodeColourGoals02 = '#dda63a';
var nodeColourGoals03 = '#4c9f38';
var nodeColourGoals04 = '#ff3a21';
var nodeColourGoals05 = '#fd6925';
var nodeColourGoals06 = '#3f7e44';
var nodeColourGoals07 = '#0a97d9';
var nodeColourGoals09 = '#0000ff';
var playerColour = 'rgb(147, 26, 232)';

var blinkColor = 'white';

var nodeColourPolicy = '#fff';
var nodeOutlineColour = '#ffffff';
var nodeOutlineWidth = '3px';
var nodeInactiveFill = '#2b2b2b';
var nodeInactiveStroke = 'white';
var linkStrokeColourInactive = '#666';
linkStrokeColourActive = '#666';

var nodeMaxValue;
var nodeMinValue;
var linkMaxValue;
var linkMinValue;

var players_center_x;
var policies_center_x;
var goals_center_x;

// get url parameter
function getURLParameter(name) {
  return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [null, ''])[1].replace(/\+/g, '%20')) || null;
}
function getTableIdFromURL() {
  return getURLParameter("tableId");
}
var tableId = getTableIdFromURL()

// 'vis setup'
visRadius = 50;
var threshold = 60;

// ELEMENT HEIGHTS
var tooltipHeight = '300';
var tooltipWidth = '300';

incremental_value = 0;
policies_index = 0;
goals_index = 0;
players_index = 0;

var svg = d3.select(".d3"),
    width = +svg.attr("width"),
    height = +svg.attr("height"),
    color = d3.scaleOrdinal(d3.schemeCategory10);
marginTop = 150;

var simulation = d3.forceSimulation()
    .force("charge", d3.forceManyBody().strength(-100))
    .force("link", d3.forceLink().id(function(d) { return d.id; }))
    .force("center", d3.forceCenter(width / 2, 450))
    .force("collide", d3.forceCollide(visRadius))
    .on("tick", tickedd3);

var invisibleGroup = svg.append("g")
invisibleGroup.append('rect').attr('fill', 'transparent').attr('height', height).attr('width', width).attr('class', 'invisibleGroup')// .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")"),

var g = svg.append("g").attr('class', 'networkGroup').attr("transform", "translate(" + 0 + "," + marginTop + ")"),
    link = g.append("g").attr("stroke", "#000").attr("stroke-width", 1.5).selectAll(".link"),
    node = g.append("g").attr("stroke", "#fff").attr("stroke-width", 1.5).selectAll(".node"),
    nearlyActiveNode =  g.append("g").selectAll(".nearlyActiveNode");
var tooltip = svg.selectAll('.tooltip');
var nodeTxt = svg.selectAll('.nodeText');

activePercent = function(node) {
    // policy
    if(node.group == 0) {
        return node.active_percent > 1 ? 100 : (node.active_percent * 100).toFixed(2);
    } else {
        console.log(node);
        return ((node.balance / node.activation_amount) * 100).toFixed(5);
    }

}

nodeInfoHTML = function(node) {
    html = '<span style="font-size:18px; text-align:right; display:block; ">&nbsp;&nbsp;&nbsp;&nbsp;x</span>';
    html += node.short_name ? ('<h2>'+node.short_name +'</h2>') : '';
    html += '<h3>'+node.name+'</h3>';
    html += node.group < 8 ? '<p>activation: ' + activePercent(node) + '%</p><p> stored $: ' + node.resources + '</p>' : '';
    return html;
}

nodeText = function(node) {
    if(node.group > 0 && node.group < 8) {
        // return node.short_name + " " + node.balance + "$";
        return node.short_name + " " + "$"+node.balance  ;
    } else {
        if(node.group == 0) {
            let p = activePercent(node);
            return p == 100 ? "" : p + "%";
        }
        if(node.group == 8) {
            return node.name;
        }
        return '';
    }
}

var previous_layout_checksum = "";

clearingTable = false;

d3.interval(function(){

    console.log("clearing: " + clearingTable);
    if(!clearingTable) {
        new_call = "https://free-ice-cream.appspot.com/v1/tables/"+tableId+"?nocache=" + (new Date()).getTime();
        console.log(new_call)
        d3.json(new_call)
            .header("X-API-KEY", " Insert key Here :) ")
            .get(function(error, data) {
                current_layout_checksum = data.layout_checksum
                if (current_layout_checksum !== previous_layout_checksum) {

                    previous_layout_checksum = current_layout_checksum;

                    graph = data.network;
                    nodes = graph.nodes;

                    nodeMaxValue = d3.max(graph.nodes, function(d) {
                        return parseInt(d['resources']);
                    });
                    nodeMinValue = d3.min(graph.nodes, function(d) {
                        return parseInt(d['resources']);
                    });
                    linkMaxValue = d3.max(graph.links, function(d) {
                        return parseInt(d['weight']);
                    });
                    linkMinValue = d3.min(graph.links, function(d) {
                        return parseInt(d['weight']);
                    });

                    // number of goals
                    goalArray = [];
                    policiesArray = [];
                    playerArray = [];
                    for (var h = 0; h < graph.nodes.length; h++) {
                        if(graph.nodes[h].group === 0 ){
                            graph.nodes[h].index = policies_index++;
                            policiesArray.push(graph.nodes);
                        }
                        else if(graph.nodes[h].group < 8 ){
                            graph.nodes[h].index = goals_index++;
                            console.log(graph.nodes[h].index + 'goals');
                            goalArray.push(graph.nodes);
                        }
                        else{
                            graph.nodes[h].index = players_index++;
                            playerArray.push(graph.nodes);
                        }
                    }

                    linkScale = d3.scaleLinear().domain([linkMinValue, 0, linkMaxValue]).range([12,0,12]);
                    radiusScale = d3.scaleLinear().domain([nodeMinValue, nodeMaxValue]).range([20,40]);
                    secondradiusScale = d3.scaleLinear().domain([nodeMinValue, nodeMaxValue]).range([1,50]);

                    drawnetwork(graph);
                    console.log('GET call executed - the whole network redraws')
                } else {
                    graph2 = data.network;
                    //console.log(graph2.nodes);
                    for (var b = 0; b < graph2.nodes.length; b++) {

                        //console.log(graph2.nodes[b].resources);
                        d3.select('.tooltip'+graph2.nodes[b].id.replace(/-/g, ''))
                            .html(nodeInfoHTML(graph2.nodes[b]));
                        d3.select('.a'+graph2.nodes[b].id.replace(/-/g, '')).attr('r', radiusScale(graph2.nodes[b].resources));
                        /*d3.select('.link'+graph2.nodes[b].id.replace(/-/g, '')).attr("stroke", function(){
                            console.log(graph2.nodes[b]);
                          if(graph2.nodes[b].active) {
                            return "white";
                          } else {
                            return "gray";
                          }
                        });*/
                        d3.select('.link'+graph2.nodes[b].id.replace(/-/g, '')).attr("stroke-width", function(){

                                  weightInt = parseInt(graph2.nodes[b].weight);
                                  if(parseInt(graph2.nodes[b].weight) === 0){
                                      return 1;
                                  } else {return linkScale(weightInt);}
                        });
                        d3.select('.nodetext'+graph2.nodes[b].id.replace(/-/g, '')).text(function(){
                                return nodeText(graph2.nodes[b]);
                            });
                        d3.selectAll('.nearlyActiveNode').attr("r", function(){
                            if(graph2.nodes[b].active_level <= graph2.nodes[b].activation_amount - ((graph2.nodes[b].activation_amount / 100) * 10)){
                                return 0;
                            }
                            else{return radiusScale(graph2.nodes[b].resources);}
                        });

                        // apply fill on update
                        if(graph2.nodes[b].group === 0) {
                            d3.select('.a'+graph2.nodes[b].id.replace(/-/g, '')).attr('fill', graph2.nodes[b].active === true ? nodeColourPolicy : nodeInactiveFill);
                        }

                    // console.log('GET call executed - all nodes and links update');
                    }
                }

            });
    }
}, 5000);

function drawnetwork(newdata) {
    nodes = newdata.nodes;
    links = newdata.links;


    invisibleGroup.on('click', tooltipClose);

    nodeTxt = nodeTxt.data(nodes, function(d) { return d.id;});
    nodeTxt.exit().remove();
    nodeTxt = nodeTxt.enter().append("text")
        // .filter(function(d) {
        //     return d.group > 0
        // })
        .text(function(d){
            return nodeText(d);
        })
        .attr('class', function(d){
            return 'nodetext' + d.id.replace(/-/g, '');
        })
        .attr('fill', function(d) { return (d.group > 0 && d.group < 8 ? 'white' : 'gray') })
        .classed('nodeText', true)
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(0,120)')
        .merge(nodeTxt);


    // adding tooltip element
    tooltip =  tooltip.data(newdata.nodes);
    tooltip.enter()
            .append('foreignObject')
            .attr('class', function(d){
                return 'tooltip' + d.id.replace(/-/g, '');
            })
            .classed('tooltip', true)
            .attr('width', tooltipWidth)
            .attr('height', tooltipHeight)
            .style('opacity', 0)
            .attr('fill', 'white')
            .attr('font-size', '18px')
            .html(function(d){ return nodeInfoHTML(d); })
            .on('click', tooltipClose);

        tooltip.exit().remove();



    node = node.data(nodes, function(d) { return d.id;});
    node.exit().remove();

    node = node.enter().append("circle")
        .attr("r", function(d){
            return radiusScale(d.resources);
        })
        .attr('fill', function(d){
            if(d.group === 8){
              return playerColour;
            }
            if(d.active === true && d.group === 7){
              // NOTE SJ TODO ALL THIS COULD BE DONE WITH AN ARRAY AND IT WOULD MAKE THE WHOLE SYSTEM EXTENSIBLE
              return nodeColourGoals07;
            }
            if(d.active === true && d.group === 6){
              return nodeColourGoals06;
            }
            if(d.active === true && d.group === 5){
              return nodeColourGoals05;
            }
            if(d.active === true && d.group === 4){
              return nodeColourGoals04;
            }
            if(d.active === true && d.group === 3){
              return nodeColourGoals03;
            }
            if(d.active === true && d.group === 2){
              return nodeColourGoals02;
            }
            if(d.active === true && d.group === 1){
              return nodeColourGoals01;
            }
            else if(d.active === true && d.group === 0){
                return nodeColourPolicy;
            }
            else {
                    return nodeInactiveFill;
                }
            })
        .attr('stroke', function(d){
            /*if(d.resources > threshold){
                return nodeOutlineColour;
            }*/
            if(d.active === false && d.group === 7){
              return nodeColourGoals07;
            }
            if(d.active === false && d.group === 6){
              return nodeColourGoals06;
            }
            if(d.active === false && d.group === 5){
              return nodeColourGoals05;
            }
            if(d.active === false && d.group === 4){
              return nodeColourGoals04;
            }
            if(d.active === false && d.group === 3){
              return nodeColourGoals03;
            }
            if(d.active === false && d.group === 2){
              return nodeColourGoals02;
            }
            if(d.active === false && d.group === 1){
              return nodeColourGoals01;
            }
            else {
                return nodeInactiveStroke;
            }
        })
        .attr('class', function(d){
            return 'a' + d.id.replace(/-/g, '');
        })
        .attr('stroke-width', nodeOutlineWidth)
        .on('click', function(d){
            console.log(d);
            tooltipClose();
            coordinates = d3.mouse(this);
            var mousex = coordinates[0];
            var mousey = coordinates[1];
            d3.select('.tooltip' + d.id.replace(/-/g, ''))
            .attr('x', function(){
                return mousex + 15;
            })
            .attr('y', function(){
                    return mousey +15;
             })
            .attr('font-size', '18px')
            .attr('width', tooltipWidth)
            .attr('height', tooltipHeight)
            .style('opacity', 1);
        })
        .call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended))
        .merge(node);


        nearlyActiveNode = nearlyActiveNode.data(nodes, function(d) { return d.id;});
        nearlyActiveNode.exit().remove();
        nearlyActiveNode = nearlyActiveNode.enter().append("circle")
            .attr("r", function(d){
                if(d.activation_amount > d.active_level - ((d.active_level / 100) * 10)){
                    return 0;
                }
                else{return radiusScale(d.resources);}
            })
            .attr('fill', function(d){
                return 'transparent'
            })
            .attr('stroke', function(d){ return 'transparent'})
            .attr('class', function(d){
                return '';
            })
            .classed('nearlyActiveNode', true)
            .attr('stroke-width', nodeOutlineWidth)
            .on('click', function(d){
                tooltipClose();
                console.log(d);

                coordinates = d3.mouse(this);
                var mousex = coordinates[0];
                var mousey = coordinates[1];
                d3.select('.tooltip' + d.id.replace(/-/g, ''))
                .attr('x', function(){
                    return mousex + 15;
                })
                .attr('y', function(){
                        return mousey +15;
                 })
                .attr('font-size', '18px')
                .attr('width', tooltipWidth)
                .attr('height', tooltipHeight)
                .style('opacity', 1)
            })
            .call(d3.drag()
              .on("start", dragstarted)
              .on("drag", dragged)
              .on("end", dragended))

  link = link.data(links, function(d) { return d.source.id + "-" + d.target.id; });

  link.exit()
    .transition()
      .attr("stroke-opacity", 0)
      .attrTween("x1", function(d) { return function() { return d.source.x; }; })
      .attrTween("x2", function(d) { return function() { return d.target.x; }; })
      .attrTween("y1", function(d) { return function() { return d.source.y; }; })
      .attrTween("y2", function(d) { return function() { return d.target.y; }; })
      .remove();

  link = link.enter().append("line")
        .attr("stroke-width", function(d) {
            weightInt = parseInt(d.weight)
            if(parseInt(d.weight) === 0){
                return 1;
            } else {
                return linkScale(weightInt);
            }

        })
        .attr('id', function(d){
            if(d.weight > 0){
                return 'positiveLink'
            }
            else{ return 'negativeLink'}
        })
        .attr('class', function(d){
            // return 'a' + d.angle
            return 'link' + d.id.replace(/-/g, '');
        })
        .style('stroke', function(d){
            if(d.weight > 0){
                return linkStrokeColourActive
            }
            else{return linkStrokeColourInactive;}
        })
        // add url for arrows
        .style("marker-end",  function(d){return "url(#a"+d.weight+")";}) // Modified line
        .on('click', function(d){
        })
        .call(function(link) { link.transition().duration(1000).attr("stroke-opacity", 1); })
        .merge(link);

  simulation.nodes(nodes);
  simulation.force("link").links(links);
  simulation.alpha(0.3).restart();

  svg.append("defs").selectAll("marker")
      .data(links)
    .enter().append("marker")
      .attr("id", function(d){ return "a" + d.weight})
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 15)
      .attr("refY", 0)
      .attr("markerWidth", 2)
      .attr("markerHeight", 2)
      .attr("orient", "auto")
    .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .style('stroke', function(d){
          if(d.weight > 0){
              return linkStrokeColourActive;
          }
          else{return linkStrokeColourInactive;}
      })
      .style("stroke-width", 0.5)
      .style("fill", function(d){
          if(d.weight > 0){
              return linkStrokeColourActive;
          }
          else{return linkStrokeColourInactive;}
      });

    angle = 360 / nodes.length;
    degreeToRadiansConversionFactor = 0.01745329252;
    goals_center_x = width - 350;
    policies_center_x = (width) / 2;
    players_center_x = 350;
    policiesGridPositionX_index = 0;
    goalsGridPositionX_index = 0;
    playersGridPositionX_index = 0;

    for (var r = 0; r < nodes.length; r++) {
         newnode = nodes[r];

        if (newnode.group === 0){
            newnode.policiesGridPositionX_index = policiesGridPositionX_index++;

            pol_spacing_y = 700 / policiesArray.length;
            newnode.circlex = policies_center_x;
            newnode.circley = newnode.policiesGridPositionX_index * pol_spacing_y;
            console.log(newnode.policiesGridPositionX_index);
        }
        else if (newnode.group < 8){
            newnode.goalsGridPositionX_index = goalsGridPositionX_index++;

            goal_spacing_y = 700 / goalArray.length;
            newnode.circlex = goals_center_x;
            newnode.circley = newnode.goalsGridPositionX_index * goal_spacing_y;
            console.log(newnode.goalsGridPositionX_index + 'goalsUpdated');
        }
        else{
            newnode.goalsGridPositionX_index = playersGridPositionX_index++;
            players_spacing_y = 700 / playerArray.length;
            newnode.circlex = players_center_x;
            newnode.circley = playersGridPositionX_index * players_spacing_y;
            console.log("No of players = "+playerArray.length);
        }

        d3.selectAll('svg').classed('active', true)
    }
} // drawnetwork ends

function dragstarted(d) {
    if(d3.select('.circleLayout').classed('circleLayoutActive')){
        return ''
    }
    else{
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }
}

function dragged(d) {
    if(d3.select('.circleLayout').classed('circleLayoutActive')){
        return ''
    }
    else{
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }
}

function dragended(d) {
    if(d3.select('.circleLayout').classed('circleLayoutActive')){
        return ''
    }
    else{
        if (!d3.event.active) simulation.alphaTarget(0);
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }
}


function tickedd3() {
    if(d3.select('.circleLayout').classed('circleLayoutActive') ){
        console.log('circle view active');
        link
            .attr("x1", function(d) { return d.source.circlex; })
            .attr("y1", function(d) { return d.source.circley; })
            .attr("x2", function(d) { return d.target.circlex; })
            .attr("y2", function(d) { return d.target.circley; });

        node
            .attr("cx", function(d) { return d.circlex; })
            .attr("cy", function(d) { return d.circley; });

        nearlyActiveNode
            .attr("cx", function(d) { return d.circlex; })
            .attr("cy", function(d) { return d.circley; });

        nodeTxt
            .attr("x", function(d) { return d.circlex + 20; })
            .attr("y", function(d) { return d.circley + 60; })
            .attr('text-anchor', 'start');
    }
    else{
        node.attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; })

        link.attr("x1", function(d) { return d.source.x; })
              .attr("y1", function(d) { return d.source.y; })
              .attr("x2", function(d) { return d.target.x; })
              .attr("y2", function(d) { return d.target.y; });
        nodeTxt.attr("x", function(d) { return d.x; })
            .attr("y", function(d) { return d.y; })

        nearlyActiveNode.attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; })
    }
}

///////////////////////////////
/////////navigation////////////
//////////////////////////////

var buttonWidth = 80;

// button for grid layout

circleLayoutPosX = 0;

svg.append('rect')
    .attr('x', circleLayoutPosX)
    .attr('y', 2)
    .attr('width', buttonWidth)
    .attr('height', 55)
    .attr('stroke', '#333')
    .attr('fill', 'transparent')
    .attr('stroke', 'white')
    .attr('stroke-width', 3)
    .attr('rx', 5)
    .attr('ry', 5)
    .attr('class', 'circleLayout')
    .on('click', circleLayout)

svg.append('text')
    .attr('x', circleLayoutPosX + buttonWidth / 2)
    .attr('y', 28)
    .attr('fill', 'white')
    .attr('text-anchor', 'middle')
    .text('Grid')
    .on('click', circleLayout)

svg.append('text')
    .attr('x', circleLayoutPosX + buttonWidth / 2)
    .attr('y', 46)
    .attr('fill', 'white')
    .attr('text-anchor', 'middle')
    .text('View')
    .on('click', circleLayout)

// button for mesh layout

var meshLayoutPosX = 100;

svg.append('rect')
    .attr('x', meshLayoutPosX)
    .attr('y', 2)
    .attr('width', buttonWidth)
    .attr('height', 55)
    .attr('stroke', '#333')
    .attr('fill', 'transparent')
    .attr('stroke', 'white')
    .attr('stroke-width', 3)
    .attr('rx', 5)
    .attr('ry', 5)
    .attr('class', 'networkLayout')
    .on('click', networkLayout)

svg.append('text')
    .attr('x', meshLayoutPosX + buttonWidth / 2)
    .attr('y', 28)
    .attr('fill', 'white')
    .attr('text-anchor', 'middle')
    .text('Mesh')
    .on('click', networkLayout)


svg.append('text')
    .attr('x', meshLayoutPosX + buttonWidth / 2)
    .attr('y', 46)
    .attr('fill', 'white')
    .attr('text-anchor', 'middle')
    .text('View')
    .on('click', networkLayout)


// button for clear table

var clearTablePosX = 200;

svg.append('rect')
    .attr('x', clearTablePosX)
    .attr('y', 2)
    .attr('width', 80)
    .attr('height', 55)
    .attr('stroke', '#333')
    .attr('fill', 'transparent')
    .attr('stroke', 'white')
    .attr('stroke-width', 3)
    .attr('rx', 5)
    .attr('ry', 5)
    .attr('class', 'networkLayout')
    .on('click', networkLayout)

svg.append('text')
    .attr('x', clearTablePosX + buttonWidth/2)
    .attr('y', 28)
    .attr('fill', 'white')
    .attr('text-anchor', 'middle')
    .text('Whole')
    .on('click', networkLayout)


svg.append('text')
    .attr('x', clearTablePosX + buttonWidth/2)
    .attr('y', 46)
    .attr('fill', 'white')
    .attr('text-anchor', 'middle')
    .text('Network')
    .on('click', function() { clearTable(); })

$(document).ready(function() {
    $("#clearButtonDiv").click(function() {
        clearTable();
    });
});


clearTable = function() {
    if(!clearingTable) {
        console.log("clearing table...");
        clearingTable = true;
        setHeader = function(xhr) { xhr.setRequestHeader("X-API-KEY", " Insert Key Here :) "); }
        $.ajax({
              url: 'https://free-ice-cream.appspot.com/v1/tables/' + tableId + '/clear',
              type: 'PUT',
              dataType: 'json',
              success: function(data) {
                console.log(data);
                clearingTable = false;
              },
              error: function(error) {
                console.log(error);
                clearingTable = false;
            },
              beforeSend: setHeader
            });
    }
}

// button for reload page

var reloadPosX = 300;

svg.append('rect')
    .attr('x', reloadPosX)
    .attr('y', 2)
    .attr('width', 80)
    .attr('height', 55)
    .attr('stroke', '#333')
    .attr('fill', 'transparent')
    .attr('stroke', 'white')
    .attr('stroke-width', 3)
    .attr('rx', 5)
    .attr('ry', 5)
    .attr('class', 'networkLayout')
    .on('click', networkLayout)

svg.append('text')
    .attr('x', reloadPosX + buttonWidth/2)
    .attr('y', 28)
    .attr('fill', 'white')
    .attr('text-anchor', 'middle')
    .text('Reload')
    .on('click', networkLayout)


svg.append('text')
    .attr('x', reloadPosX + buttonWidth/2)
    .attr('y', 46)
    .attr('fill', 'white')
    .attr('text-anchor', 'middle')
    .text('Table')
    .on('click', function() { location.reload(); })


// title

svg.append('text')
    .attr('x', width / 2)
    .attr('y', 45)
    .attr('fill', 'white')
    .attr('class', 'h1')
    .attr('text-anchor', 'middle')
    .text('Playable Data for Human Health')

/////////////////////
//////legend////////
///////////////////
goalCircleArray = ['#3f7e44', '#dda63a', '#ff3a21', '#fd6925', '#4c9738', '#26BDE2', '#e5243b'];

// svg.append('circle')
//     .attr('class', 'blink_me')
//     .attr('cx', 12)
//     .attr('cy', (height - 400))
//     .attr('r', 10)
//     .attr('fill', function(d){ return blinkColor});
//
// svg
//     .append('text')
//     .attr('class', 'goalText')
//     .attr('x', 32)
//     .attr('y', height - 392)
//     .text(function(d){return 'nearly active goal'})
//     .attr('fill', 'white')

svg.selectAll('.goalCircle').data(goalCircleArray)
    .enter().append('circle')
    .attr('class', 'goalCircle')
    .attr('cx', 12)
    .attr('cy', function(d,i){return (height - 200)  -((i+1) *25) })
    .attr('r', 10)
    .attr('fill', function(d){ return d });

svg
    .append('text')
    .attr('class', 'goalText')
    .attr('x', 42)
    .attr('y', height - 292)
    // .attr('y', function(d,i){return (height - 150)  -((i+1) *25) })
    .text(function(d){return 'active goals'})
    .attr('fill', 'white')
    // .attr('fill', function(d){ return d });

// policy nodes
svg.append('circle')
    .attr('cx', 12)
    .attr('cy', height - 200)
    .attr('r', 10)
    .attr('fill', nodeInactiveFill)
    .attr('stroke', nodeColourGoals01)
    .attr('stroke-width', 3);


svg.append('text')
    .attr('x', 32)
    .attr('y', height - 192)
    .attr('fill', nodeColourPolicy)
    .attr('text-anchor', 'right')
    .text('inactive goal');

// Player node
svg.append('circle')
    .attr('cx', 12)
    .attr('cy', height - 175)
    .attr('r', 10)
    .attr('fill', playerColour)
    .attr('stroke', nodeInactiveStroke)
    .attr('stroke-width', 2);


svg.append('text')
    .attr('x', 32)
    .attr('y', height - 167)
    .attr('fill', nodeColourPolicy)
    .attr('text-anchor', 'right')
    .text('player');

// positive link node
svg.append('line')
    .attr('x1', 32)
    .attr('y1', (height - 200) - 25)
    .attr('x2', 32)
    .attr('y2', (height - 200) - (7 * 25))
    .attr('stroke', linkStrokeColourInactive);

// policy nodes
svg.append('circle')
    .attr('cx', 12)
    .attr('cy', height - 75)
    .attr('r', 10)
    .attr('fill', nodeColourPolicy);

svg.append('text')
    .attr('x', 32)
    .attr('y', height - 67)
    .attr('fill', nodeColourPolicy)
    .attr('text-anchor', 'right')
    .text('active policy');

// inactive node
svg.append('circle')
    .attr('cx', 12)
    .attr('cy', height - 100)
    .attr('r', 10)
    .attr('fill', nodeInactiveFill)
    .attr('stroke-width', 3)
    .attr('stroke', nodeInactiveStroke);

svg.append('text')
    .attr('x', 32)
    .attr('y', height - 92)
    .attr('fill', 'white')
    .attr('text-anchor', 'right')
    .text('policies under active threshold');

// positive link node
svg.append('line')
    .attr('x1', 4)
    .attr('y1', height - 125)
    .attr('x2', 19)
    .attr('y2', height - 125)
    .attr('stroke', linkStrokeColourInactive);

svg.append('text')
    .attr('x', 32)
    .attr('y', height - 117)
    .attr('fill', linkStrokeColourInactive)
    .attr('text-anchor', 'right')
    .text('positive impact');

// NEGATIVE link node
svg.append('line')
    .attr('x1', 4)
    .attr('y1', height - 150)
    .attr('x2', 19)
    .attr('y2', height - 150)
    .attr('stroke-width', 2)
    .attr('stroke', linkStrokeColourActive)
    .attr('id', 'negativeLink');

svg.append('text')
    .attr('x', 32)
    .attr('y', height - 142)
    .attr('fill', linkStrokeColourActive)
    .attr('text-anchor', 'right')
    .text('negative impact');


function circleLayout() {
    d3.selectAll('circle').transition();
    d3.select('.circleLayout').classed('circleLayoutActive', true);
    d3.select('.networkLayout').classed('networkLayoutActive', false);

    svg.append('text')
        .attr('x', policies_center_x)
        .attr('y', 100)
        .attr('fill', 'white')
        .attr('text-anchor', 'middle')
        .attr('class', 'gridViewText')
        .text('Policies')

    svg.append('text')
        .attr('x', players_center_x)
        .attr('y', 100)
        .attr('fill', 'white')
        .attr('text-anchor', 'middle')
        .attr('class', 'gridViewText')
        .text('Players')

    svg.append('text')
        .attr('x', goals_center_x)
        .attr('y', 100)
        .attr('fill', 'white')
        .attr('text-anchor', 'middle')
        .attr('class', 'gridViewText')
        .text('Goals')

    tooltipClose()
    simulation.stop();
    link.transition().duration(5000)
        .attr("x1", function(d) { return d.source.circlex; })
        .attr("y1", function(d) { return d.source.circley; })
        .attr("x2", function(d) { return d.target.circlex; })
        .attr("y2", function(d) { return d.target.circley; });

    node.transition().duration(5000)
        .attr("cx", function(d) { return d.circlex; })
        .attr("cy", function(d) { return d.circley; });

    nearlyActiveNode.transition().duration(5000)
        .attr("cx", function(d) { return d.circlex; })
        .attr("cy", function(d) { return d.circley; });

    nodeTxt.transition().duration(5000)
        .attr("x", function(d) { return d.circlex + 20; })
        .attr("y", function(d) { return d.circley + 60; })
        .attr('text-anchor', 'start');
}



function networkLayout() {
    d3.selectAll('circle').transition();

    d3.select('.circleLayout').classed('circleLayoutActive', false);
    d3.select('.networkLayout').classed('networkLayoutActive', true);

    d3.selectAll('.gridViewText').remove();

    tooltipClose();
    link.transition().duration(5000)
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node.transition().duration(5000)
        .attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });

    nearlyActiveNode.transition().duration(5000)
        .attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });

    nodeTxt.transition().duration(5000)
        .attr("x", function(d) { return d.x; })
        .attr("y", function(d) { return d.y; })
        .attr('text-anchor', 'middle');

}

function tooltipClose(){
    d3.selectAll('.tooltip').attr('width', 0).attr('height', 0).style('opacity', 0).attr('font-size', '0px');
};
