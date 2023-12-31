///////////////////////////////////////////////////////////////////////////////
//////////////     Large-scale Arctic Wetland Classification     //////////////
///////////////////////////////////////////////////////////////////////////////

Map.addLayer(valdata, {color: 'red'}, 'class')

///////////////////////////////////////////////////////////////////////////////
///////////     Sentinel-2 Imagery Collection and Preprocessing     ///////////
///////////////////////////////////////////////////////////////////////////////

//Function to mask the clouds in Sentinel-2
function maskS2clouds(image) {
  var qa = image.select('QA60');

  // Bits 10 and 11 are clouds and cirrus, respectively.
  var cloudBitMask = 1 << 10;
  var cirrusBitMask = 1 << 11;

  // Both flags should be set to zero, indicating clear conditions.
  var mask = qa.bitwiseAnd(cloudBitMask).eq(0)
      .and(qa.bitwiseAnd(cirrusBitMask).eq(0));

  return image.updateMask(mask).divide(10000);
}

var S2_2019 = ee.ImageCollection('COPERNICUS/S2_SR')
                  .filterDate('2019-06-15', '2019-08-31')
                  .filterBounds(roi)
                  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE',20))
                  .map(maskS2clouds);
var S2_2020 = ee.ImageCollection('COPERNICUS/S2_SR')
                  .filterDate('2020-06-15', '2020-08-31')
                  .filterBounds(roi)
                  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE',20))
                  .map(maskS2clouds);
var S2_2021 = ee.ImageCollection('COPERNICUS/S2_SR')
                  .filterDate('2021-06-15', '2021-08-31')
                  .filterBounds(roi)
                  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE',20))
                  .map(maskS2clouds);

var Optical_Merge_01 = S2_2021.merge(S2_2020).merge(S2_2019)
var Optical_Merge_02 = Optical_Merge_01.select('B2','B3','B4','B5','B6','B7','B8','B8A','B11','B12')
var Optical_Median = Optical_Merge_02.median();
// print('All metadata:', Optical_Median)

///////////////////////////////////////////////////////////////////////////////
///////////////////////     Optical Spectral Indices    /////////// ///////////
///////////////////////   https://www.indexdatabase.de  ///////////////////////
///////////////////////////////////////////////////////////////////////////////

// Normalized Difference Vegetation Index
var NDVI = Optical_Median.normalizedDifference(['B8', 'B4']).rename('NDVI');
// Normalized Difference Built-up Index
var NDBI = Optical_Median.normalizedDifference(['B11', 'B8']).rename('NDBI');
// Enhanced Vegetation Index
var EVI = Optical_Median.expression(
    '2.5 * ((NIR - RED) / (NIR + 6 * RED - 7.5 * BLUE + 1))', {
      'NIR': Optical_Median.select('B8'),
      'RED': Optical_Median.select('B4'),
      'BLUE': Optical_Median.select('B2')
}).rename('EVI');
// Soil Adjusted Vegetation Index
var SAVI = Optical_Median.expression(
    '1.5 * ((NIR - RED) / (NIR +  RED + 0.5))', {
      'NIR': Optical_Median.select('B8'),
      'RED': Optical_Median.select('B4'),
      'BLUE': Optical_Median.select('B2')
}).rename('SAVI');
// Normalized Difference Snow Index
var NDSI = Optical_Median.expression(
    '((GREEN - SWIR) / (GREEN + SWIR))', {
      'GREEN': Optical_Median.select('B3'),
      'SWIR': Optical_Median.select('B12'),
}).rename('NDSI');
// Red Edge Normalized Difference Vegetation Index
var RENDVI = Optical_Median.expression(
    '((NNIR - RE2) / (NNIR + RE2))', {
      'NNIR': Optical_Median.select('B8A'),
      'RE2': Optical_Median.select('B6'),
}).rename('RENDVI');
// Normalized Burn Ratio
var NBR = Optical_Median.expression(
    ' ((NIR - SWIR2) / (NIR + SWIR2))', {
      'NIR': Optical_Median.select('B8'),
      'SWIR2': Optical_Median.select('B12')
}).rename('NBR');
// Normalized Differenced Water Index
var NDWI = Optical_Median.expression(
    ' ((Green - NIR) / (Green + NIR))', {
      'NIR': Optical_Median.select('B8'),
      'Green': Optical_Median.select('B3')
}).rename('NDWI');
// Other Indices for Consideration Depending on Geography/Region.
// Normalized Difference Moisture Index
//var NDMI = Optical_Median.expression(
    //' ((NIR - SWIR) / (NIR + SWIR))', {
      //'NIR': Optical_Median.select('B8'),
      //'RED': Optical_Median.select('B4'),
      //'SWIR': Optical_Median.select('B11')
//}).rename('NDMI');
// Bare Soil Index
//var BSI = Optical_Median.expression(
  //'((RED + SWIR) - (NIR + BLUE)) / ((RED + SWIR) + (NIR + BLUE)) ', {
    //'RED': Optical_Median.select('B4'), 
    //'BLUE': Optical_Median.select('B2'),
    //'NIR': Optical_Median.select('B8'),
    //'SWIR': Optical_Median.select('B11'),
//}).rename('BSI')
// Green Chlorophyll Vegetation Index //
//var GCVI = Optical_Median.expression(
    //'(NIR - Green) - 1', {
      //'NIR': Optical_Median.select('B8'),
      //'Green': Optical_Median.select('B3')
//}).rename('GCVI');
// Green Normalized Difference Vegetation Index
//var GNDVI = Optical_Median.expression(
    //'((NIR - Green) / (NIR + Green))', {
      //'NIR': Optical_Median.select('B8'),
      //'Green': Optical_Median.select('B3')
//}).rename('GNDVI');
// Green Soil Adjusted Vegetation Index
//var GSAVI = Optical_Median.expression(
    //'1.5 * ((NIR - Green) / (NIR +  Green + 0.5))', {
      //'NIR': Optical_Median.select('B8'),
      //'RED': Optical_Median.select('B4'),
      //'Green': Optical_Median.select('B3')
//}).rename('GSAVI');
// Difference Vegetation Index
//var DVI = Optical_Median.expression(
    //'(NIR - RED)', {
      //'NIR': Optical_Median.select('B8'),
      //'RED': Optical_Median.select('B4'),
//}).rename('DVI');
// Normalized Difference Red Edge Index
//var NDRE = Optical_Median.expression(
    //'((RE2 - RE1) / (RE2 + RE1))', {
      //'RE2': Optical_Median.select('B6'),
      //'RE1': Optical_Median.select('B5'),
//}).rename('NDRE');
// Simple Ratio
//var RVI = Optical_Median.expression(
    //'(NIR / RED)', {
      //'NIR': Optical_Median.select('B8'),
      //'RED': Optical_Median.select('B4'),
//}).rename('RVI');

// Stack all optical variables.
// var composite_OPTICAL = ee.Image.cat(Optical_Median, NDVI, NDBI, EVI, BSI, SAVI, GSAVI, NDMI, NDRE, RVI, NDSI, RENDVI, GCVI, NBR, NDWI);
// Stack specific optical variables.
var composite_OPTICAL = ee.Image.cat(Optical_Median, NDVI, NDBI, EVI, SAVI, NDSI, RENDVI, NBR, NDWI);
//print('All metadata:', composite_OPTICAL)

///////////////////////////////////////////////////////////////////////////////
////////////////     ArcticDEM Collection and Preprocessing     ///////////////
////////////////    https://www.pgc.umn.edu/data/arcticdem/     ///////////////
///////////////////////////////////////////////////////////////////////////////
var DEM = ee.Image('UMN/PGC/ArcticDEM/V3/2m_mosaic')
var elevation = DEM.select('elevation');
elevation = elevation.rename('ELEVATION')
elevation = elevation.clip(roi);

var slope = ee.Terrain.slope(elevation);
slope = slope.rename('SLOPE')
slope = slope.clip(roi);

var aspect = ee.Terrain.aspect(DEM);
aspect = aspect.rename('ASPECT')
aspect = aspect.clip(roi);

var composite_DEM =  ee.Image.cat(elevation,slope,aspect)
// print('All metadata:', composite_DEM)

///////////////////////////////////////////////////////////////////////////////
//////////////     MERIT Hydro Collection and Preprocessing      //////////////
///////////// http://hydro.iis.u-tokyo.ac.jp/~yamadai/MERIT_Hydro/  ///////////
///////////////////////////////////////////////////////////////////////////////

var HYDRO = ee.Image("MERIT/Hydro/v1_0_1")

// Height Above Nearest Drainage (HAND)           
var HAND = HYDRO.select('hnd');
HAND = HAND.rename('HAND')
HAND = HAND.clip(roi);

// Flow Accumulation Area
var Flow = HYDRO.select('upa');
Flow = Flow.rename('Flow')
Flow = Flow.clip(roi);

var composite_HYDRO =  ee.Image.cat(HAND, Flow)
// print('All metadata:', composite_HYDRO)

///////////////////////////////////////////////////////////////////////////////
//////////////////////     Sentinel-1 Image Collection    /////////////////////
///////////////////////////////////////////////////////////////////////////////

// Mask out pixels with no observations   
var maskEmptyPixelsS1 = function(image) {
////////              Find pixels that had observations.            ////////
  var withVV = image.select('VV').gt(-38);
  var withVH = image.select('VH').gt(-38);
  return image.updateMask(withVV.updateMask(withVH));
};

// Load Sentinel-1 C-band SAR GRD (log scale, VV)
var Sentinel_VV = ee.ImageCollection('COPERNICUS/S1_GRD')
.filter(ee.Filter.eq('instrumentMode', 'IW'))
.filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
.filterMetadata('resolution_meters', 'equals' , 10)
.filterBounds(roi)
.map(maskEmptyPixelsS1)
.map(function(image){return image.clip(roi)})
.select('VV');
var summersentvv2019 = Sentinel_VV.filterDate('2019-06-15', '2019-08-31');
var summersentvv2020 = Sentinel_VV.filterDate('2020-06-15', '2020-08-31');
var summersentvv2021 = Sentinel_VV.filterDate('2021-06-15', '2021-08-31');
var Sentinel_VV = summersentvv2019.merge(summersentvv2020).merge(summersentvv2021)
var Sentinel_VV_SAR = Sentinel_VV.median();

// Load Sentinel-1 C-band SAR GRD (log scale, VH)  
var Sentinel_VH = ee.ImageCollection('COPERNICUS/S1_GRD')
.filter(ee.Filter.eq('instrumentMode', 'IW'))
.filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH'))
.filterMetadata('resolution_meters', 'equals' , 10)
.filterBounds(roi)
.map(maskEmptyPixelsS1)
.map(function(image){return image.clip(roi)})
.select('VH');
var summersentvh2019 = Sentinel_VH.filterDate('2019-06-15', '2019-08-31');
var summersentvh2020 = Sentinel_VH.filterDate('2020-06-15', '2020-08-31');
var summersentvh2021 = Sentinel_VH.filterDate('2021-06-15', '2021-08-31');
var Sentinel_VH = summersentvh2019.merge(summersentvh2020).merge(summersentvh2021)
var Sentinel_VH_SAR = Sentinel_VH.median();

// Stack SAR backscatter bands.
var Sentinel_VV_VH = ee.Image.cat(Sentinel_VV_SAR,Sentinel_VH_SAR);
var Sentinel_1_bands = ['VV','VH'];
//print('All metadata:', Sentinel_VV_VH)

///////////////////////////////////////////////////////////////////////////////
/////////////////////     Sentinel-1 Speckle Filtering    /////////////////////
///////////////////////////////////////////////////////////////////////////////

var SMOOTHING_RADIUS = 25;
var Sentinel_VV_Filtered = Sentinel_VV_SAR.focal_median(SMOOTHING_RADIUS, 'circle', 'meters').rename('Sentinel_VV_Filtered'); 
var Sentinel_VH_Filtered = Sentinel_VH_SAR.focal_median(SMOOTHING_RADIUS, 'circle', 'meters').rename('Sentinel_VH_Filtered');
// Map.addLayer(SARVV_Sentinel_1_Filtered, {min: -25, max: 5}, 'SARVV', true);
// Map.addLayer(SARVH_Sentinel_1_Filtered, {min: -25, max: 5}, 'SARVV', true);

var Sentinel_Composite = ee.Image.cat(Sentinel_VV_Filtered,Sentinel_VH_Filtered);
var Sentinel_Composite=Sentinel_Composite.rename('VV', 'VH');
// print('All metadata:', Sentinel_Composite)

///////////////////////////////////////////////////////////////////////////////
//////////////////////////     Sentinel-1 Features    /////////////////////////
///////////////////////////////////////////////////////////////////////////////

// Polarization Ratios                 
var Sentinel_VV_Squared = Sentinel_VV_Filtered.multiply(Sentinel_VV_Filtered);
var Sentinel_VH_Squared = Sentinel_VH_Filtered.multiply(Sentinel_VH_Filtered);
var VVVH_Ratio = Sentinel_VV_Squared.divide(Sentinel_VH_Squared);
var VVVH_Ratio = VVVH_Ratio.rename('VVVH_Ratio')
// var VHVV_Ratio = Sentinel_VH_Squared.divide(Sentinel_VV_Squared);
// var VHVV_Ratio = VHVV_Ratio.rename('VHVV_Ratio')

// Span
var Sentinel_Squared=Sentinel_VV_Squared.addBands(Sentinel_VH_Squared);
var Sentinel_Squared=Sentinel_Squared.rename('Sentinel_VV_Span', 'Sentinel_VH_Span')
var Sentinel_Span = Sentinel_Squared.expression(
    '(VV + VH)', {
      'VV': Sentinel_Squared.select('Sentinel_VV_Span'),
      'VH': Sentinel_Squared.select('Sentinel_VH_Span')
}).rename('Sentinel_Span');

// Radar Vegetation Index (RVI)
var Sentinel_RVI = Sentinel_Squared.expression(
    '(VH * 4)/(VH + VV)', {
      'VH': Sentinel_Squared.select('Sentinel_VH_Span'),
      'VV': Sentinel_Squared.select('Sentinel_VV_Span'),
}).rename('Sentinel_RVI');

///////////////////////////////////////////////////////////////////////////////
/////////////////////     ALOS PALSAR Image Collection    /////////////////////
///////////////////////////////////////////////////////////////////////////////

// Load ALOS PALSAR L-band SAR (HV)
var ALOS_HV = ee.ImageCollection('JAXA/ALOS/PALSAR/YEARLY/SAR')
.map(function(image){return image.clip(roi)});
var ALOS_HV_SAR = ALOS_HV.select('HV');
var ALOS_HV_SAR = {
  min: 0.0,
  max: 10000.0,
};
var ALOS_HV_2019 = ALOS_HV.filterDate('2019-01-01', '2020-01-01');
var ALOS_HV_2020 = ALOS_HV.filterDate('2020-01-01', '2021-01-01');
var ALOS_HV_2021 = ALOS_HV.filterDate('2021-01-01', '2022-01-01');

var ALOS_HV_SAR_LBand = ALOS_HV_2019.merge(ALOS_HV_2020).merge(ALOS_HV_2021);
var ALOS_HV_SAR_LBand = ALOS_HV_SAR_LBand.select("HV")
var ALOS_HV_SAR_LBand_Composite = ALOS_HV_SAR_LBand.median()

// Load ALOS PALSAR L-band SAR (HH)
var ALOS_HH = ee.ImageCollection('JAXA/ALOS/PALSAR/YEARLY/SAR')
.map(function(image){return image.clip(roi)});
var ALOS_HH_SAR = ALOS_HH.select('HH');
var ALOS_HH_SAR = {
  min: 0.0,
  max: 10000.0,
};
var ALOS_HH_2019 = ALOS_HH.filterDate('2019-01-01', '2020-01-01');
var ALOS_HH_2020 = ALOS_HH.filterDate('2020-01-01', '2021-01-01');
var ALOS_HH_2021 = ALOS_HH.filterDate('2021-01-01', '2022-01-01');

var ALOS_HH_SAR_LBand = ALOS_HH_2019.merge(ALOS_HH_2020).merge(ALOS_HH_2021);
var ALOS_HH_SAR_LBand = ALOS_HH_SAR_LBand.select("HH")
var ALOS_HH_SAR_LBand_Composite = ALOS_HH_SAR_LBand.median()

var ALOS_HH_HV = ee.Image.cat(ALOS_HH_SAR_LBand_Composite, ALOS_HV_SAR_LBand_Composite);
var ALOS_Bands = ['HH','HV']

///////////////////////////////////////////////////////////////////////////////
/////////////////////     ALOS PALSAR Speckle Filtering    ////////////////////
///////////////////////////////////////////////////////////////////////////////

var SMOOTHING_RADIUS = 25;
var ALOS_HH_Filtered = ALOS_HH_SAR_LBand_Composite.focal_median(SMOOTHING_RADIUS, 'circle', 'meters').rename('ALOS_HH_Filtered'); 
var ALOS_HV_Filtered = ALOS_HV_SAR_LBand_Composite.focal_median(SMOOTHING_RADIUS, 'circle', 'meters').rename('ALOS_HV_Filtered');

var ALOS_Composite = ee.Image.cat(ALOS_HH_Filtered, ALOS_HV_Filtered);
var ALOS_Composite=ALOS_Composite.rename('HH', 'HV');
//print('All metadata:', ALOS_Composite)

///////////////////////////////////////////////////////////////////////////////
///////////////////////     ALOS PALSAR Features    ///////////////////////////
///////////////////////////////////////////////////////////////////////////////

// Polarization Ratios 
var ALOS_HH_Squared = ALOS_HH_Filtered.multiply(ALOS_HH_Filtered);
var ALOS_HV_Squared = ALOS_HV_Filtered.multiply(ALOS_HV_Filtered);
var HHHV_Ratio = ALOS_HH_Squared.divide(ALOS_HV_Squared);
var HHHV_Ratio = VVVH_Ratio.rename('HHHV_Ratio')
//var HVHH_Ratio = ALOS_HV_Squared.divide(ALOS_HH_Squared);
//var HVHH_Ratio = VHVV_Ratio.rename('HVHH_Ratio')

// Span
var ALOS_Squared=ALOS_HH_Squared.addBands(ALOS_HV_Squared);
var ALOS_Squared=ALOS_Squared.rename('ALOS_HH_Span', 'ALOS_HV_Span');
var ALOS_Span = ALOS_Squared.expression(
    '(HH + HV)', {
      'HH': ALOS_Squared.select('ALOS_HH_Span'),
      'HV': ALOS_Squared.select('ALOS_HV_Span')
}).rename('ALOS_Span');

// Radar Vegetation Index (RVI)
var ALOS_RVI = ALOS_Squared.expression(
    '(HV * 4)/(HV + HH)', {
      'HV': ALOS_Squared.select('ALOS_HV_Span'),
      'HH': ALOS_Squared.select('ALOS_HH_Span'),
}).rename('ALOS_RVI');

///////////////////////////////////////////////////////////////////////////////
/////////////////////////     SAR Feature Stacking    /////////////////////////
///////////////////////////////////////////////////////////////////////////////

var Composite_SAR = ee.Image.cat(Sentinel_Composite, VVVH_Ratio, Sentinel_Span, Sentinel_RVI, ALOS_Composite, HHHV_Ratio, ALOS_Span, ALOS_RVI)
// print('All metadata:', SAR_Composite)

/////////////////////////////////////////////////////////////////////////////////////////
///////////////////////    ERA5 Collection and Preprocessing      ///////////////////////
/////////// https://www.ecmwf.int/en/forecasts/datasets/reanalysis-datasets/era5 ////////
/////////////////////////////////////////////////////////////////////////////////////////

// Temperature
var Temp_Avg = ee.ImageCollection("ECMWF/ERA5/MONTHLY")
                  .filterDate('2012-01-01', '2021-12-31')
                  .filterBounds(roi)
                  .select('mean_2m_air_temperature');
                  
var Temp_Mean = Temp_Avg.mean();                 
Temp_Mean = Temp_Mean.clip(roi)
Temp_Mean = Temp_Mean.rename('Temp_Mean');

var Temp_Deviation = ee.ImageCollection("ECMWF/ERA5/MONTHLY")
                  .filterDate('2012-01-01', '2021-12-31')
                  .filterBounds(roi)
                  .select('mean_2m_air_temperature');

var Temp_Std = Temp_Deviation.reduce(ee.Reducer.stdDev());
Temp_Std = Temp_Std.clip(roi) 
Temp_Std = Temp_Std.rename('Temp_Std');

// Precipitation
var Precip_Avg = ee.ImageCollection("ECMWF/ERA5/MONTHLY")
                  .filterDate('2012-01-01', '2021-12-31')
                  .filterBounds(roi)
                  .select('total_precipitation');
                  
var Precip_Mean = Precip_Avg.mean();
Precip_Mean = Precip_Mean.clip(roi)
Precip_Mean = Precip_Mean.rename('Precip_Mean');

var Precip_Deviation = ee.ImageCollection("ECMWF/ERA5/MONTHLY")
                  .filterDate('2012-01-01', '2021-12-31')
                  .filterBounds(roi)
                  .select('total_precipitation');

var Precip_Std = Precip_Deviation.reduce(ee.Reducer.stdDev());
Precip_Std = Precip_Std.clip(roi)
Precip_Std = Precip_Std.rename('Precip_Std');
                  
var Composite_CLIMATE = ee.Image.cat(Temp_Mean, Temp_Std, Precip_Mean, Precip_Std)

///////////////////////////////////////////////////////////////////////////////
//////////////////     Multi-Source Feature Stacking    ///////////////////////
///////////////////////////////////////////////////////////////////////////////

var EO_Stack = ee.Image.cat(composite_OPTICAL, composite_DEM, composite_HYDRO, Composite_SAR, Composite_CLIMATE);
//print(EO_Stack);

///////////////////////////////////////////////////////////////////////////////
/////////////////////////     OBIA Segmentation    ////////////////////////////
///////////////////////////////////////////////////////////////////////////////

// Segmentation processing.
var seeds = ee.Algorithms.Image.Segmentation.seedGrid(10);
var snic = ee.Algorithms.Image.Segmentation.SNIC({
  image: Optical_Median.select('B2','B3','B4','B8'), 
  compactness: 0.1,  
  connectivity: 8,  
  neighborhoodSize: 256, 
  seeds: seeds
}).reproject({
  crs: composite_OPTICAL.projection().crs(),
  scale: 10
});

// Select the band "clusters" from the snic output fixed on its scale of 10 meters and add them the PC1 taken from the PCA data.
// Calculate the mean for each segment with respect to the pixels in that cluster
var clusters_snic = snic.select("clusters")
// Map.addLayer(clusters_snic.randomVisualizer(), {}, 'clusters')
clusters_snic = clusters_snic.reproject ({crs: clusters_snic.projection (), scale: 10});

//Export the image ojects to your Google Drive for viewing in a GIS.
//Export.image.toDrive({
  //image: clusters_snic,
    //description: "SNIC_Objects",
    //scale: 10,
    //folder: 'OBIA',
    //region: roi,
    //maxPixels: 10000000000000,
    //fileFormat: 'GeoTIFF'
//}); 

var composite_mean = EO_Stack.addBands(clusters_snic).reduceConnectedComponents(ee.Reducer.mean(), 'clusters', 256)
var final_bands = ee.Image.cat(composite_mean);
// Define the training bands removing just the "clusters" bands.
var predictionBands=final_bands.bandNames().remove("clusters")

///////////////////////////////////////////////////////////////////////////////
///////////////////////     OBIA Train/Test Data    ///////////////////////////
///////////////////////////////////////////////////////////////////////////////

var OBIA_Val_Random = valdata.randomColumn('random');
var OBIA_split = 1.0
var OBIA_Train_Data = OBIA_Val_Random.filter(ee.Filter.lt('random',OBIA_split))
var OBIA_Test_Data = OBIA_Val_Random.filter(ee.Filter.gte('random',OBIA_split))

var OBIA_Train_Model = OBIA_Train_Data.map(function(feature) {
  return final_bands.select(predictionBands).sampleRegions({
  collection: feature, properties: ['class'], scale: 10, tileScale:16, geometries: true  
  });
}).flatten();

var OBIA_Test_Model = OBIA_Test_Data.map(function(feature) {
  return final_bands.select(predictionBands).sampleRegions({
  collection: feature, properties: ['class'], scale: 10, tileScale:16, geometries: true 
  });
}).flatten();

///////////////////////////////////////////////////////////////////////////////
//////////////////////     OBIA Machine Learning    ///////////////////////////
///////////////////////////////////////////////////////////////////////////////

// Train the RF classifier.
var OBIA_Classifier_Model = ee.Classifier.smileRandomForest(100).train({
  features: OBIA_Train_Model, classProperty: 'class', inputProperties: predictionBands
});
// Apply the RF classifier.
var OBIA_Classification = final_bands.classify(OBIA_Classifier_Model);

// Export the OBIA RF classification.
Export.image.toDrive({
  image: OBIA_Classification,
    description: "OBIA_Classification_Laura",
    scale: 10,
    folder: 'GEE',
    region: roi,
    maxPixels: 10000000000000,
    fileFormat: 'GeoTIFF'
}); 

///////////////////////////////////////////////////////////////////////////////
//////////////////////     PBIA Train/Test Data    ////////////////////////////
///////////////////////////////////////////////////////////////////////////////

var PBIA_Bands =   ['B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B8A', 'B11', 'B12',
                    'NDVI', 'NDBI', 'EVI', 'SAVI', 'NDSI', 'RENDVI', 'NBR', 'NDWI',
                    'ELEVATION', 'SLOPE', 'ASPECT', 'HAND', 'Flow',
                    'VV', 'VH', 'HH', 'HV', 'VVVH_Ratio', 'Sentinel_Span', 'Sentinel_RVI', 'HHHV_Ratio', 'ALOS_Span', 'ALOS_RVI',
                    'Temp_Mean', 'Temp_Std', 'Precip_Mean', 'Precip_Std']

var PBIA_Val_Random = valdata.randomColumn('random');
var PBIA_split = 0.7
var PBIA_Train_Data = PBIA_Val_Random.filter(ee.Filter.lt('random',PBIA_split))
var PBIA_Test_Data = PBIA_Val_Random.filter(ee.Filter.gte('random',PBIA_split))
                      
var PBIA_Train_Model = PBIA_Train_Data.map(function(feature) {
  return EO_Stack.select(PBIA_Bands).sampleRegions({
  collection: feature, properties: ['class'], scale: 10, tileScale:16, geometries: true  
  });
}).flatten();
                
var PBIA_Train_Null = PBIA_Train_Model.filter(
  ee.Filter.notNull(PBIA_Train_Model.first().propertyNames())
);

var PBIA_Test_Model = PBIA_Test_Data.map(function(feature) {
  return EO_Stack.select(PBIA_Bands).sampleRegions({
  collection: feature, properties: ['class'], scale: 10, tileScale:16, geometries: true  
  });
}).flatten();

var PBIA_Test_Null = PBIA_Test_Model.filter(
  ee.Filter.notNull(PBIA_Test_Model.first().propertyNames())
);

///////////////////////////////////////////////////////////////////////////////
////////////////////////     PBIA Machine Learning    /////////////////////////
///////////////////////////////////////////////////////////////////////////////

// Train the PBIA RF classifier.
var PBIA_Classifier_Model = ee.Classifier.smileRandomForest(100).train({
  features: PBIA_Train_Null, classProperty: 'class', inputProperties: PBIA_Bands
});
// Apply the PBIA RF classifier.
var PBIA_Classification = EO_Stack.classify(PBIA_Classifier_Model);

// Export the PBIA RF classification.
Export.image.toDrive({
  image: PBIA_Classification,
    description: "PBIA_Classification",
    scale: 10,
    folder: 'GEE',
    region: roi,
    maxPixels: 10000000000000,
    fileFormat: 'GeoTIFF'
}); 

///////////////////////////////////////////////////////////////////////////////
//////////////////////////     Accuracy Assessment    /////////////////////////
///////////////////////////////////////////////////////////////////////////////

// OBIA Test Model.
var OBIA_Classification_AA = OBIA_Test_Model.classify(OBIA_Classifier_Model);

var OBIA_Test_Accuracy = OBIA_Classification_AA.errorMatrix('class', 'OBIA_Classification_AA');
var OBIA_Array = ee.Feature(null, {matrix: OBIA_Test_Accuracy.array()})

Export.table.toDrive({
  collection: ee.FeatureCollection(OBIA_Array),
  description: 'OBIA_Array',
  fileFormat: 'CSV',
  folder: "GEE"
});

// PBIA Test Model.
var PBIA_Classification_AA = PBIA_Test_Model.classify(PBIA_Classifier_Model);

var PBIA_Test_Accuracy = PBIA_Classification_AA.errorMatrix('class', 'PBIA_Classification_AA');
var PBIA_Array = ee.Feature(null, {matrix: PBIA_Test_Accuracy.array()})

Export.table.toDrive({
  collection: ee.FeatureCollection(PBIA_Array),
  description: 'PBIA_Array',
  fileFormat: 'CSV',
  folder: "GEE"
});

///////////////////////////////////////////////////////////////////////////////
/////////////////////////     Variable Importance    //////////////////////////
///////////////////////////////////////////////////////////////////////////////

// OBIA Variable importance chart.
var OBIA_Explain =  OBIA_Classifier_Model.explain();
                    //print('Explain:',OBIA_Explain);
var OBIA_Importance = ee.Feature(null, ee.Dictionary(OBIA_Explain).get('importance'));
var OBIA_Importance_Chart = ui.Chart.feature.byProperty(OBIA_Importance)
                    .setChartType('ColumnChart')
                    .setOptions({
                    title: 'RF OBIA Importance',
                    legend: {position: 'none'},
                    hAxis: {title: 'Bands'},
                    vAxis: {title: 'Importance'}
                    });
                    //print(OBIA_Importance_Chart);
// PBIA Variable importance chart.
var PBIA_Explain =  PBIA_Classifier_Model.explain();
                    print('Explain:',PBIA_Explain);
var PBIA_Importance = ee.Feature(null, ee.Dictionary(PBIA_Explain).get('importance'));
var PBIA_Importance_Chart = ui.Chart.feature.byProperty(PBIA_Importance)
                    .setChartType('ColumnChart')
                    .setOptions({
                    title: 'RF PBIA Importance',
                    legend: {position: 'none'},
                    hAxis: {title: 'Bands'},
                    vAxis: {title: 'Importance'}
                    });
                    //print(PBIA_Importance_Chart);