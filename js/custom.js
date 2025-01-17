//////////////////////
// global variables //
//////////////////////

	//file path variables
	var fileArray = ['data/floods/v1.geojson',
					 'data/floods/v2.geojson',
					 'data/floods/v3.geojson',
					 'data/floods/v4.geojson',
					 'data/floods/v5.geojson',
					 'data/floods/v6.geojson',
					 'data/floods/v7.geojson'];

	var dikeFile = 'data/dike.geojson'

	var aggregateFloodStatistics = 'data/floods/aggregateFloodStatistics.json';

	//map layer variables
	var floodDataArray = [];
	var dike;
	var breakPoints;
	var aggregateFloodStats;

	var depth = ['579.21 ft','582.79 ft','583.81 ft','584.97 ft','586.75 ft','588.20 ft','591.00 ft'];

	var floodLevelArray = ['Annual Mean for Lakes Michigan-Huron from 1918-2014',
							'Record High Monthly Mean for Lakes Michigan-Huron from 1918-2014',
							'Gage Extreme High (hourly) [April 30, 1997, 7:00 pm Central Standard Time]',
							'Estimation of the Storm of April 9, 1973',
							'Recent high water level + worst surge',
							'Record Historic Storm Surge Projected on Record High Monthly Mean',
							'Base Flood Elevation for AE Zone east of Menominee Avenue'];

	//variables to control map interactions
	var currentIndex = 0,
		prevIndex = 0;

	var currentLayer = 'lakes';

	//setting zoom and pan bounds 
	var topleft = L.latLng(44.695755, -88.260835),
	  	bottomright = L.latLng(44.378889, -87.710832),
	  	bounds = L.latLngBounds(topleft, bottomright);

	// initialize the map with geographical coordinates set on Green Bay
	var map = L.map("map",
		{
			minZoom: 12,
			maxZoom: 18,
			maxBounds: bounds
		})
		.setView([44.527676, -87.993452], 13);

	map.zoomControl.setPosition('topright')


	// L.Control.OpacSlider = L.Control.extend({
	//     onAdd: function(map) {
	//         var img = L.DomUtil.create('img');

	//         img.src = '../../docs/images/logo.png';
	//         img.style.width = '200px';

	//         return img;
	//     },

	//     onRemove: function(map) {
	//         // Nothing to do here
	//     }
	// });

	// L.control.opacSlider = function(opts) {
	//     return new L.Control.OpacSlider(opts);
	// }

	// L.control.opacSlider({ position: 'bottomleft' }).addTo(map);

	//streets tileset
	var cartoDB_Map = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
		{
			attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
			subdomains: 'abcd',
		}).addTo(map);

	//satellite tileset
// 	var HERE_hybridDay = L.tileLayer('https://{s}.{base}.maps.cit.api.here.com/maptile/2.1/{type}/{mapID}/hybrid.day/{z}/{x}/{y}/{size}/{format}?app_id={app_id}&app_code={app_code}&lg={language}', {
// 		attribution: 'Map &copy; 1987-2014 <a href="http://developer.here.com">HERE</a>',
// 		subdomains: '1234',
// 		mapID: 'newest',
// 		app_id: '4hRsdRmGBf2l2Hn2o1ET',
// 		app_code: 'Am10DtpE3d21BS94dezWSg',
// 		base: 'aerial',
// 		maxZoom: 18,
// 		minZoom: 12,
// 		type: 'maptile',
// 		language: 'eng',
// 		format: 'png8',
// 		size: '256'
// 	}).setOpacity(0).addTo(map);

	var HERE_hybridDay = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
		attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
		maxZoom: 18,
		minZoom: 12
	}).setOpacity(0).addTo(map);




//////////////////////
////// Doc Setup /////
//////////////////////

	// load first flood data when page loads
	$('#document').ready(function()
	{
		getData();
		createFloodLevelSlider();
		createOpacitySlider();

		// legend is hidden when page initially loads
		$('#legendPanel').hide();

		//information panel is hidden when page initially loads
		$('#infoPanel').hide();

		//disable drag when on info panel
		$('#stopPropPanel').on('mousedown dblclick wheel', function(e)
		{
			L.DomEvent.stopPropagation(e);
		});

		//disable drag when on legend
		$('.panel').on('mousedown dblclick wheel', function(e)
		{
			L.DomEvent.stopPropagation(e);
		});
	});



	// load information into the information panel on load
	getAggregateStatistics();



//////////////////////
/////// Buttons //////
//////////////////////

	/////////////////////////////////////
	// buttons to load layers onto map //
	/////////////////////////////////////

	//reset to map load state
	$('#reset').on('click', function() 
	{
		resetFloods();
		resetOpacitySlider()
		turnOnFloods();
	});

	$('#breaks').on('click', function()
	{
		turnOnFloods();
		turnOnDike();
		map.on('zoomend ', function(e) 
		{
			if ( map.getZoom() > 15 ){ dike.setStyle({weight: 4})}
			else if ( map.getZoom() <= 15 ){ dike.setStyle({weight: 2})}
		});
	});

	//load sovi when clicked
	$('#SOVI').click(function() 
	{
		currentLayer = 'sovi'; 
		loadSOVI();
		
	});

	//load businesses
	$('#BLS').click(function() 
	{
		currentLayer = 'bls'; 
		loadBLS();
		
	});

	//load population affected
	$('#affectedPop').click(function() 
	{
		currentLayer = 'affectedPop'; 
		loadAffectedPopulation();
		
	});

	//load property loss
	$('#propertyLost').click(function() 
	{
		currentLayer = 'propertyLost'; 
		loadPropertyLoss();
		
	});

	//load median income
	$('#medianIncome').click(function() 
	{
		currentLayer = 'medianIncome';
		loadMedianIncome();
		
	});

	// turn on the flooding layer
	$('#turnOnFloods').on('click', function()
	{
		turnOnFloods();
	});

	//////////////////////////////////////
	// buttons to change flood levels/////
	//////////////////////////////////////

	//changing the water level via the buttons while adjusting the slider
	$('#6').on('click', function()
	{
		$('#slider-vertical').slider("value", 6);
		prevIndex = currentIndex;
		currentIndex = 6;
		updateFloodLayers();
	})
	$('#5').on('click', function()
	{
		$('#slider-vertical').slider("value", 5);
		prevIndex = currentIndex;
		currentIndex = 5;
		updateFloodLayers();
	})
	$('#4').on('click', function()
	{
		$('#slider-vertical').slider("value", 4);
		prevIndex = currentIndex;
		currentIndex = 4;
		updateFloodLayers();
	})
	$('#3').on('click', function()
	{
		$('#slider-vertical').slider("value", 3);
		prevIndex = currentIndex;
		currentIndex = 3;
		updateFloodLayers();
	})
	$('#2').on('click', function()
	{
		$('#slider-vertical').slider("value", 2);
		prevIndex = currentIndex;
		currentIndex = 2;
		updateFloodLayers();
	})
	$('#1').on('click', function()
	{
		$('#slider-vertical').slider("value", 1);
		prevIndex = currentIndex;
		currentIndex = 1;
		updateFloodLayers();
	})
	$('#0').on('click', function()
	{
		$('#slider-vertical').slider("value", 0);
		prevIndex = currentIndex;
		currentIndex = 0;
		updateFloodLayers();
	})


	//////////////////////////////////////
	// buttons to load data into legend //
	//////////////////////////////////////

	// show the dike legend when question is clicked
	$('#dikeBreakInfo').on('click', function()
	{
		var title = 'Dike Location';
		$('#replace').remove();
		$('#colorLegend').append('<div id="replace" style="text-align: left;">');
		$('#legendHeader').html(title);
		$('#legendText').html('This layer shows locations where the dike may breach for each flood level.');
		$('#replace').append('<svg height="20" width="200">' +
								'<line x1="2" y1="10" x2="27" y2="10" style="stroke:black;stroke-width:2" />' +
								'<text x="37" y="14" fill="#000">Existing Dike</text>' +
							'</svg>');

		showLegend();
	});

	// show sovi legend when question is clicked
	$('#soviInfo').on('click', function()
	{
		loadSoviLegendData();

		showLegend();
	});

	// show bls\employment legend when question is clicked
	$('#blsInfo').on('click', function()
	{
		loadEmploymentLegendData();

		showLegend();
	});

	// show population legend when question is clicked
	$('#populationInfo').on('click', function()
	{
		loadPopulationLegendData();

		showLegend();
	});

	// show property loses legend when question is clicked
	$('#propertyLostInfo').on('click', function()
	{
		loadPropertyLossesLegendData();

		showLegend();
	});

	// show median income legend when question is clicked
	$('#incomeInfo').on('click', function()
	{
		loadIncomeLegendData();

		showLegend();
	});




//////////////////////////
// info panel functions //
//////////////////////////

	// show info panel when show is clicked
	$('#showInfoPanel').on('click', function()
	{
		showInfoPanel();
	})

	// close the info panel when close is clicked
	$('#hideInfoPanel').on('click', function()
	{
		hideInfoPanel();
	})

	// show the info panel
	function showInfoPanel()
	{
		$('#infoPanel').fadeIn('slow');
	}

	// hide the legend
	function hideInfoPanel()
	{
		$('#infoPanel').fadeOut('slow');
	}


//////////////////////
// legend functions //
//////////////////////

	///////////////////////
	// create the legend //
	///////////////////////

	function createLegend(colors, breaks, description, title)
	{
		$('#replace').remove();
		$('#colorLegend').append('<div id="replace" style="text-align: left;">');
		$('#legendHeader').html(title);

		$('#legendText').html(description);

		for(var i = colors.length - 1; i >= 0; i--)
		{
			$('#replace').append('<li style="list-style-type:none"><span><div style="float: left; display: inline-block; width:15px; height:15px; background-color:' + colors[i] + '"></div><div class="legendSpacer" style="width:10px; display: inline-block"></div>'+breaks[i]+ '</span></li>')
		};
	};


	///////////////////////
	// open close legend //
	///////////////////////

	// close the legend on click
	$('#legendClose').on('click', function()
	{
		hideLegend();
	})

	// show the legend
	function showLegend()
	{
		$('#legendPanel').fadeIn('slow');
	}

	// hide the legend
	function hideLegend()
	{
		$('#legendPanel').fadeOut('slow');
	}


	///////////////////////////////////
	// functions to load legend data //
	///////////////////////////////////

	// load sovi specific info into legend 
	function loadSoviLegendData()
	{
		var title = 'Social Vulnerability Index';
		var colorArray = ['#ddd', '#fb6a4a', '#de2d26', '#a50f15'];
		var classBreaks = ['No Data', 'Low', 'Medium', 'High'];
 		var description = "The Social Vulnerability Index (SoVI) is a metric to compare social vulnerability to natural hazards across the United States. It is calculated using 29 socioeconomic variables by the <a href='https://artsandsciences.sc.edu/geog/hvri/sovi%C2%AE-0' target='_blank'>Hazards and Vulnerability Research Institute</a> at the University of South Carolina. The data are primarily taken from the <a href='https://www.census.gov/' target='_blank'>US Census Bureau</a>. Vulnerability is displayed at census block group level for each flood level.";


		createLegend(colorArray, classBreaks, description, title);	
	}

	// load employment specific info legend 
	function loadEmploymentLegendData()
	{
		var title = 'Business';
		var colorArray = ['#ddd', '#c994c7', '#df65b0', '#e7298a', '#980043'];
		var classBreaks = ['No Data', '<100', '100 - 499', '500 - 999', '>1,000'];
		var description = 'This is a measure of the impact of flooding on businesses. It maps the number of employees that work for each business within an affected area. Data originated from the <a href="https://www.bls.gov/" target="_blank">Bureau of Labor Statistics</a> and was downloaded from <a href="https://coast.noaa.gov/arcgis/rest/services/LakeLevels/Employees/MapServer" target="_blank">NOAA</a>. It is displayed at census block group level.';

		createLegend(colorArray, classBreaks, description, title);		
	}

	// load poplation data into legend
	function loadPopulationLegendData()
	{
		var title = 'Population Affected'
		var colorArray = ['#ddd', '#bcbddc', '#9e9ac8', '#807dba', '#6a51a3', '#54278f', '#3f007d'];
		var classBreaks = ['No Data', '1 - 100', '100 - 300', '300 - 800', '800 - 1,350', '1,350 - 2,220', '>2,500'];
		var description = 'This is an estimate of number of people affected by flooding. Census block group level population data were taken from the <a href="https://www.census.gov/acs/www/data/data-tables-and-tools/data-profiles/2014/" target="_blank">2014 American Community Survey</a>. The number of people is based on the percentage of flooded area that is within a block group. Non-residential parcels were removed from the calculation.';

		createLegend(colorArray, classBreaks, description, title);		
	} 

	// load property lost data into legend
	function loadPropertyLossesLegendData()
	{
		var title = 'Property Loss';
		var colorArray = ['#ddd', '#fdd0a2', '#fdae6b', '#fd8d3c', '#e6550d', '#a63603'];
		var classBreaks = ['$0', '$8,900 - $1.6 million', '$1.6 - $11 million', '$11 - $23 million', '$82 - $152 million', '>$152 million'];
		var description = 'This is an estimate of property lost from flooding. Improved structure values were taken from parcel data and aggregated to the census block group level.';

		createLegend(colorArray, classBreaks, description, title);		
	}

	// load income data into legend
	function loadIncomeLegendData()
	{
		var title = 'Median Household Income';
	
		var colorArray = ['#ddd', '#74c476', '#41ab5d', '#238b45', '#006d2c', '#00441b'];
		var classBreaks = ['No Data', '$13,000 - $34,000', '$34,000 - $42,000', '$42,000 - $55,000', '$55,000 - $73,000', '$73,000 - $99,000', '>$99,000'];
		var description = "This layer shows the median household income by census block group. Data were taken from the <a href='https://www.census.gov/acs/www/data/data-tables-and-tools/data-profiles/2014/' target='_blank'>2014 American Community Survey</a>.";

		createLegend(colorArray, classBreaks, description, title);		
	}

	/////////////////////////////////////////
	// aggregate flooding statistics panel // 
	/////////////////////////////////////////

	//get aggregate flooding statistics data
	function getAggregateStatistics()
	{
		$.ajax(aggregateFloodStatistics,
		{
			dataType: 'json',
			success: function(response)
			{
				//dummy 
				aggregateFloodStats = response;
			}
		}).done(function(response)
		{
			$('#waterLevel').html(depth[currentIndex]);
			$('#floodHeader').html(floodLevelArray[0]);
			$('#totalFloodedArea').html(aggregateFloodStats[currentIndex].floodArea);
			$('#maxPropertyLosses').html(aggregateFloodStats[currentIndex].maxPropLosses);
			$('#peopleAffected').html(aggregateFloodStats[currentIndex].numPeopleAffected);
		})		
	};

	//update aggregate flooding statistics in info panel based on flood level
	function updateAggregateStatistics()
	{
		$('#waterLevel').html(depth[currentIndex]);
		$('#floodHeader').html(floodLevelArray[currentIndex]);
		$('#totalFloodedArea').html(aggregateFloodStats[currentIndex].floodArea);
		$('#maxPropertyLosses').html(aggregateFloodStats[currentIndex].maxPropLosses);
		$('#peopleAffected').html(aggregateFloodStats[currentIndex].numPeopleAffected);
	}





///////////////////////
/////////Sliders///////
///////////////////////

	/////////////////////////////
	/////// Satellite Slider ////
	/////////////////////////////

	function resetOpacitySlider ()
	{
		HERE_hybridDay.setOpacity(0);
		$('#OPslide').val(0)

	};


	function createOpacitySlider()
	{
		$('#OPslide').attr(
		{
			max: 1,
			min: 0,
			value: 0,
			step: .1
		});

		$('#OPslide').on('input', function()
		{
			var value = $('#OPslide').val();
			HERE_hybridDay.setOpacity(value);
			if(map.hasLayer(dike))
			{
				dike.eachLayer(function(layer)
				{
					if(value > .7)
					{
						layer.setStyle({color: '#eee'});
					}
					else
					{
						layer.setStyle({color: '#333'});
					}
				});
			}
		});
	};

	////////////////////////
	// flood level slider //
	////////////////////////


	// create the flood level slider
function createFloodLevelSlider()
{	
// set slider attributes
	$('#slider-holder').append('<div id="slider-vertical">')
	$("#slider-vertical" ).slider
		({
     	 	orientation: "vertical",
      		range: "max",
      		min: -1,
      		max: 6,
      		value: 0,
      		step: 1,
      		slide: function( event, ui ) 
		    {

				if(ui.value == -1)
				{
					ui.value = 0;
					$('#slider-vertical').remove();
					createFloodLevelSlider();

				};
				prevIndex = currentIndex;
				currentIndex =  ui.value;
				updateFloodLayers();

				// updateAggregateStatistics();
		  	}

		});

};


//////////////////////
/////Flood Levels/////
//////////////////////

	// turn on the flood levels
	function turnOnFloods() 
	{
		currentLayer = 'lakes';

		map.removeLayer(floodDataArray[currentIndex]);

		floodDataArray[0].addTo(map);
		floodDataArray[0].eachLayer(function(layer)
		{
			layer.setStyle({fillColor: '#128AB3', stroke: false, fillOpacity: .5});
		});

		//restylize each layer in floods
		for(var i = 1; i < floodDataArray.length; i++)
		{
			floodDataArray[i].eachLayer(function(layer)
			{
				layer.setStyle({fillColor: '#128AB3', stroke: false, fillOpacity: .2});
			});
		};

		//add floods up to current index
		for(var i = 1; i <= Number(currentIndex); i++)
		{
			floodDataArray[i].addTo(map);
		};
	};

	// update flood levels 
	function updateFloodLayers()
	{
		var change = currentIndex - prevIndex;

		//slider has moved forward
		//add number of layers that the slider has moved
		if(currentLayer == 'lakes')
		{

			if(change > 0)
			{
				for(var i = Number(prevIndex) + 1; i <= Number(currentIndex); i++)
				{
					var addFloodLayer = floodDataArray[i].addTo(map);
					$(addFloodLayer).fadeIn(5000)
				};
			}

			//slider has moved backwards
			//remove number of layers that slider has moved
			else if(change < 0)
			{
				for(var i = Number(currentIndex) + 1; i <= Number(prevIndex); i++)
				{
					map.removeLayer(floodDataArray[i]);
				};
			};
		}

		if(currentLayer != 'lakes')
		{
			switch(currentLayer) 
			{
				case 'sovi': loadSOVI(); break;
				case 'bls': loadBLS(); break;
				case 'affectedPop': loadAffectedPopulation(); break;
				case 'propertyLost': loadPropertyLoss(); break;
				case 'medianIncome': loadMedianIncome(); break;
			};
		};

		updateAggregateStatistics();
	};

	// reset/re-add the number of flood levels based on current index
	function resetFloods()
	{
		currentLayer = 'lakes';
		currentIndex = 0;
		prevIndex = 0;

		removeExtraLayers();

		updateAggregateStatistics();

		$('#slider-vertical').slider("value", 0);
	};



//////////////////////
///////Overlays///////
//////////////////////

	//////////////////////////////
	// update and remove layers //
	//////////////////////////////

	function turnOnDike()
	{
		//style dike like based on opacity of satellite
		var value = $('#OPslide').val();
		dike.eachLayer(function(layer)
		{
			if(value > .7)
			{
				layer.setStyle({color: '#eee'});
			}
			else
			{
				layer.setStyle({color: '#333'});
			}
		});

		if(!map.hasLayer(dike))
		{
			dike.addTo(map);
		};
	};


	//remove all layers except the basemap
	function removeExtraLayers()
	{
		map.eachLayer(function(layer)
		{			
			map.removeLayer(layer);	
		});
		cartoDB_Map.addTo(map);
		HERE_hybridDay.addTo(map);
	};


	function loadSOVI() 
	{
		
		//style info
		var colorArray = ['#ddd', '#fb6a4a', '#de2d26', '#a50f15'];

		removeExtraLayers();

		floodDataArray[currentIndex].addTo(map);

		floodDataArray[currentIndex].eachLayer(function(layer)
		{
			
			var soviIndex = layer.feature.properties.sovi_3cl;

			setCommonStyle(layer);

			//no data
			if(!soviIndex)
			{
				layer.setStyle({fillColor: colorArray[0]});	
			}
			
			//sovi classes
			switch(soviIndex)
			{
				case 'Low': layer.setStyle({fillColor: colorArray[1]}); break;
				case 'Medium': layer.setStyle({fillColor: colorArray[2]}); break;
				case 'High': layer.setStyle({fillColor: colorArray[3]}); break;
			};

		});
	};

	//load the business at risk data
	function loadBLS() 
	{

		var colorArray = ['#ddd', '#c994c7', '#df65b0', '#e7298a', '#980043'];

		removeExtraLayers()

		floodDataArray[currentIndex].addTo(map);

		floodDataArray[currentIndex].eachLayer(function(layer)
		{	
			var blsIndex = layer.feature.properties.employment;

			setCommonStyle(layer);

			//nodata
			if(!blsIndex)
			{
				layer.setStyle({fillColor: colorArray[0]});	
			}
			
			//bls classes
			switch(blsIndex)
			{
				case '<100': layer.setStyle({fillColor: colorArray[1]}); break;
				case '100-499': layer.setStyle({fillColor: colorArray[2]}); break;
				case '500-999': layer.setStyle({fillColor: colorArray[3]}); break;
				case '1,000 or Greater': layer.setStyle({fillColor: colorArray[4]}); break;
				case 'Suppressed': layer.setStyle({fillColor: colorArray[0]}); break;
			};
		});
	};


	//load the number of people affected
	function loadAffectedPopulation() 
	{

		var colorArray = ['#ddd', '#bcbddc', '#9e9ac8', '#807dba', '#6a51a3', '#54278f', '#3f007d'];

		//remove all the layers
		removeExtraLayers()

		//add back only the current layer
		floodDataArray[currentIndex].addTo(map);

		//stylize each layer
		floodDataArray[currentIndex].eachLayer(function(layer)
		{
			// console.log(layer.feature.properties.TOTAL_PEOP)
			var popIndex = layer.feature.properties.affected_p;

			setCommonStyle(layer);

			//nodata
			if(popIndex == 0)
			{
				layer.setStyle({fillColor: colorArray[0], fillOpacity: .5});	
			}
			else if(popIndex < 100)
			{ 
				layer.setStyle({fillColor: colorArray[1]}); 
			}
			else if(popIndex < 300)
			{
				layer.setStyle({fillColor: colorArray[2]}); 
			}
			else if(popIndex < 800)
			{
				layer.setStyle({fillColor: colorArray[3]});
			}
			else if(popIndex < 1350)
			{
				layer.setStyle({fillColor: colorArray[4]});
			}
			else if(popIndex < 2220)
			{
				layer.setStyle({fillColor: colorArray[5]});
			}
		});
	};

	//load property lost
	function loadPropertyLoss() 
	{
		var colorArray = ['#ddd', '#fdd0a2', '#fdae6b', '#fd8d3c', '#e6550d', '#a63603'];

		//remove all the layers
		removeExtraLayers()

		//add back only the current layer
		floodDataArray[currentIndex].addTo(map);

		//stylize each layer
		floodDataArray[currentIndex].eachLayer(function(layer)
		{
			var propIndex = layer.feature.properties.max_proper;

			setCommonStyle(layer);

			//affected pop classes
			if(propIndex == 0)
			{
				layer.setStyle({fillColor: colorArray[0]});	
			}
			else if(propIndex < 1600000)
			{ 
				layer.setStyle({fillColor: colorArray[1]}); 
			}
			else if(propIndex < 11000000)
			{
				layer.setStyle({fillColor: colorArray[2]}); 
			}
			else if(propIndex < 23000000)
			{
				layer.setStyle({fillColor: colorArray[3]});
			}
			else if(propIndex < 82000000)
			{
				layer.setStyle({fillColor: colorArray[4]});
			}
			else if(propIndex < 152000000)
			{
				layer.setStyle({fillColor: colorArray[5]});
			};
		});
	};

	//load median income
	function loadMedianIncome() 
	{
		var colorArray = ['#ddd', '#74c476', '#41ab5d', '#238b45', '#006d2c', '#00441b'];

		//remove all the layers
		removeExtraLayers()

		//add back only the current layer
		floodDataArray[currentIndex].addTo(map);

		//stylize each layer
		floodDataArray[currentIndex].eachLayer(function(layer)
		{	
			var incomeIndex = layer.feature.properties.median_inc;

			setCommonStyle(layer);

			//income of 0
			if(incomeIndex == 0)
			{
				layer.setStyle({fillColor: colorArray[0]});	
			}
			else if(incomeIndex < 34000)
			{ 
				layer.setStyle({fillColor: colorArray[1]}); 
			}
			else if(incomeIndex < 42000)
			{
				layer.setStyle({fillColor: colorArray[2]}); 
			}
			else if(incomeIndex< 55000)
			{
				layer.setStyle({fillColor: colorArray[3]});
			}
			else if(incomeIndex < 73000)
			{
				layer.setStyle({fillColor: colorArray[4]});
			}
			else if(incomeIndex < 99000)
			{
				layer.setStyle({fillColor: colorArray[5]});
			}
		});
	};

	function setCommonStyle(layer) {
		layer.setStyle({fillOpacity: .65, stroke: true, color: '#eee', weight: 2})
	}



///////////////////////
///////Data Calls//////
///////////////////////

	//get the map data
	function getData()
	{
		var floodColor =  '#128AB3'; 
		//flood level 1
		$.ajax(fileArray[0],
		{
			dataType: 'json',
			success: function(response)
			{
				floodDataArray[0] = L.geoJson(response,
				{
					style: function (feature)
					{
						return {fillColor: floodColor, stroke: false, fillOpacity: .5, clickable: false};
					}
				}).addTo(map);
			}
		});

		//dike
	  $.ajax(dikeFile,
		{
			dataType: 'json',
			success: function(response)
			{
				dike = L.geoJson(response,
				{
					style: function (feature)
					{
						return {color: '#333', weight: 2, opacity: 1, clickable: false};
					}
				});
			},
			error: function(response) {
				console.log('Unable to add dike')
			}
		});

		//flood level 2
		$.ajax(fileArray[1],
		{
			dataType: 'json',
			success: function(response)
			{
				floodDataArray[1] = L.geoJson(response,
				{
					style: function (feature)
					{
						return {fillColor: floodColor, stroke: false, fillOpacity: .2, clickable: false};
					}
				});
			}
		});


		//flood level 3
		$.ajax(fileArray[2],
		{
			dataType: 'json',
			success: function(response)
			{
				floodDataArray[2] = L.geoJson(response,
				{
					style: function (feature)
					{
						return {fillColor: floodColor, stroke: false, fillOpacity: .2, clickable: false};
					}
				});
			}
		});

		//flood level 4
		$.ajax(fileArray[3],
		{
			dataType: 'json',
			success: function(response)
			{
				floodDataArray[3] = L.geoJson(response,
				{
					style: function (feature)
					{
						return {fillColor: floodColor, stroke: false, fillOpacity: .2, clickable: false};
					}
				});
			}
		});

		//flood level 5
		$.ajax(fileArray[4],
		{
			dataType: 'json',
			success: function(response)
			{
				floodDataArray[4] = L.geoJson(response,
				{
					style: function (feature)
					{
						return {fillColor: floodColor, stroke: false, fillOpacity: .2, clickable: false};
					}
				});
			}
		});

		//flood level 6
		$.ajax(fileArray[5],
		{
			dataType: 'json',
			success: function(response)
			{
				floodDataArray[5] = L.geoJson(response,
				{
					style: function (feature)
					{
						return {fillColor: floodColor, stroke: false, fillOpacity: .2, clickable: false};
					}
				});
			}
		});

		//flood level 7
		$.ajax(fileArray[6],
		{
			dataType: 'json',
			success: function(response)
			{
				floodDataArray[6] = L.geoJson(response,
				{
					style: function (feature)
					{
						return {fillColor: floodColor, stroke: false, fillOpacity: .2, clickable: false};
					}
				});
			}
		});

	};
