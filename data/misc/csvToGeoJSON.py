"""
@name Python Roman Numeral CSV GeoJSON/JSON File
@file csvToGeoJSON.py
@author Andrew Dyck
@author Daniel Pronych
@date October 2012
@version 1.0.0

Convert CSVToGeoJSON for PollStations2012.csv obtained from the City of Regina 
Open Data website located at: 
  http://openregina.cloudapp.net/DataBrowser/OpenRegina/

Adding initial use of Saskatoon Open Data located at:
  "http://www.saskatoon.ca/DEPARTMENTS/Corporate%20Services/
Corporate%20Information%20Services/OpenData/Pages/OpenData.aspx"

Original File: "https://github.com/andrewjdyck/infantProjects/blob/master/
csvToGeoJSON/csvToGeoJSON.py"
Original Date File Was Obtained: October 20, 2012
"""

## @var __author__
#Script Author
__author__ = 'Andrew Dyck; Daniel Pronych'

## @var __version__
# Script Release Version
__version__ = '1.0.0'

class GPSPoint():
    """ @brief GPS Point Class
    @author Daniel Pronych
    @date October 2012
    @version 1.0.0
    """
    def __init__(self, latitude, longitude, altitude=0.0):
        """Initialization Routine
        @param latitude The latitude value
        @param longitude The longitude value
        @param altitude The altitude value
        """
        self.__latitude = latitude
        self.__longitude = longitude
        self.__altitude = altitude
    
    def latitude(self):
        """Latitude Routine
        @return Latitude value"""
        return self.__latitude
    
    def longitude(self):
        """Longitude Routine
        @return Longitude value"""
        return self.__longitude
    
    def altitude(self):
        """Altitude Routine
        @return Altitude value"""
        return self.__altitude
    
    def __str__(self):
        """String Routine"""
        return "%s, %s, %s" % (self.__latitude, self.__longitude,
            self.__altitude)
    
    latitude = property(latitude)
    longitude = property(longitude)
    altitude = property(altitude)

def generate_jsonpoll_regina(infile):
    """@brief Determine City of Regina Latitude and Longitude
    limits and return to caller (botLeft and topRight)
    @param infile Input File
    @return list containing Min Lat, Min Lon, Max Lon, Max Lat."""
    from xml.dom.minidom import parseString
    
    ## @var maxlon
    # Contains the maximum longitude value, start at minimum
    maxlon = -179.99
    ## @var maxlat
    # Contains the maximum longitude value, start at minimum
    maxlat = -90.0
    ## @var minlon
    # Contains the minimum longitude value, start at maximum
    minlon = 179.99
    ## @var minlat
    # Contains the minimum longitude value, start at maximum
    minlat = 90.0
    
    ## @var fh
    # The file handle to the City Limits XML/KML file
    fh = open(infile, 'r')
    ## @var data
    # Contains the file contents
    data = fh.read()
    if(fh):
        fh.close()
    ## @var dom
    # Contains the DOM object contents
    dom = parseString(data)
    ## @var dom
    # Reads the specific tag contents
    xmlTag = dom.getElementsByTagName('coordinates')[0].toxml()
    ## @var xmlData
    # Reads the specific tag contents
    xmlData = xmlTag.replace('<coordinates>','').replace('</coordinates>','')
    # Remove trailing spaces
    xmlData = xmlData.strip()
    # Parse Individual entries of "long, lat, altitude"
    for xmlEntry in xmlData.split(' '):
        ## @var xmlEntryRow
        # Contains the Row Data split by commas
        xmlEntryRow = xmlEntry.split(',')
        ## @var lon
        # Individual Longitude Value
        lon = float(xmlEntryRow[0])
        ## @var lat
        # Individual Latitude Value
        lat = float(xmlEntryRow[1])
        # Altitude is xmlEntryRow[2]; however, not needed now
        # Keep running track of minimums and maximums for lat and lon
        if lon < minlon:
            minlon = lon
        if lon > maxlon:
            maxlon = lon
        if lat < minlat:
            minlat = lat
        if lat > maxlat:
            maxlat = lat
    # Return value in Min Lat, Min Lon, Max Lon, Max Lat
    return [minlon, minlat, maxlon, maxlat]

def generate_jsonpoll_saskatoon(infile):
    """@brief Generate Saskatoon Polls Output Routine
    @param infile Input File
	@return list containing Min Lat, Min Lon, Max Lon, Max Lat."""
    
    from xml.dom.minidom import parseString
    
    ## @var maxlon
    # Contains the maximum longitude value, start at minimum
    maxlon = -179.99
    ## @var maxlat
    # Contains the maximum longitude value, start at minimum
    maxlat = -90.0
    ## @var minlon
    # Contains the minimum longitude value, start at maximum
    minlon = 179.99
    ## @var minlat
    # Contains the minimum longitude value, start at maximum
    minlat = 90.0
    
    ## @var fh
    # The file handle to the City Limits XML/KML file
    fh = open(infile, 'r')
    ## @var data
    # Contains the file contents
    data = fh.read()
    if(fh):
        fh.close()
    ## @var dom
    # Contains the DOM object contents
    dom = parseString(data)
    ## @var placemark
    # This data is obtained on a per row basis from the input KML/XML file
    for placemark in dom.getElementsByTagName('Placemark'):
        ## @var point
        # Contains the Point data from this row entry
        #print placemark
        #point = placemark.getElementsByTagName('Point')[0]
        ## @var coordinates
        # Contains the coordinates XML Element
        coordinates = placemark.getElementsByTagName('coordinates')[0]
        #print coordinates
        ## @var coord
        # Parse the above coordinates and split into a "long, lat, alt" array
        coords = coordinates.firstChild.nodeValue.encode('utf-8').split(' ')
        for coord in coords:
            try:
                #print coord
                ## @var lla
                # Lat, Long, Alt
                lla = coord.strip().split(',')
                #print lla[0]
                #print "len: %s" % (len(lla))
                ## @var lon
                # Contains the longitude value for this polling station
                lon = float(lla[0])
                ## @var lat
                # Contains the latitude value for this polling station
                lat = float(lla[1])
                
                # Altitude is lla[2]; however, not needed now
                # Keep running track of minimums and maximums for lat and lon
                if lon < minlon:
                    minlon = lon
                if lon > maxlon:
                    maxlon = lon
                if lat < minlat:
                    minlat = lat
                if lat > maxlat:
                    maxlat = lat
            except:
                pass
    
    # Return value in Min Lat, Min Lon, Max Lon, Max Lat
    return [minlon, minlat, maxlon, maxlat]

def generate_jsonward_regina(infile, outfile):
    """@brief Generate Saskatoon Ward Output Routine
    @param infile Input File
    @param outfile Input File"""
    from xml.dom.minidom import parseString
    
    ## @var output
    # Contains the main output
    output = \
'''[
'''

    ## @var inneroutput
    # Contains the inner output
    inneroutput = []

    template = \
    '''\
    {   
        "ward" : "%s",
        "coords" : "%s",
    }'''
	
	## @var fh
    # The file handle to the City Limits XML/KML file
    fh = open(infile, 'r')
    ## @var data
    # Contains the file contents
    data = fh.read()
    if(fh):
        fh.close()
    ## @var dom
    # Contains the DOM object contents
    dom = parseString(data)
    ## @var placemark
    # This data is obtained on a per row basis from the input KML/XML file
    for placemark in dom.getElementsByTagName('Placemark'):
        ## @var name
        # The Name of the Ward
        name = placemark.getElementsByTagName('name')[0]
        ward = name.firstChild.nodeValue.encode('utf-8')
        #print placemark
        #point = placemark.getElementsByTagName('Point')[0]
        ## @var coordinates
        # Contains the coordinates XML Element
        coordinates = placemark.getElementsByTagName('coordinates')[0]
        coords = coordinates.firstChild.nodeValue.encode('utf-8')

        inneroutput.append(template % (ward, coords))
    
    # Join the output and comma separate, also needed for no trailing comma
    output += ''',
'''.join(inneroutput)
            
    # the tail of the JSON output file
    output += '''
]
'''

	## @var outFileHandle
    # Output the contents to the JSON output file
    outFileHandle = open(outfile, 'w')
    outFileHandle.write(output.encode('utf-8'))
    outFileHandle.close()

def generate_jsonwards():
    """Generate JSON Wards Routine"""
    generate_jsonward_regina("ReginaWards.kml","regina_wards.json")
    # To implement, may require combining inputs from multiple XML/KML files
	#generate_jsonward_saskatoon("","saskatoon_wards.json")

def generate_jsonpolls(outfile):
    """Generate JSON Polls Routine
    @param outfile Output File"""
    
    ## @var inneroutput
    # The inneroutput contents, joined into output later
    inneroutput = []
    
    ## @var output
    # The output to write to the output file
    output = '''[
'''

    ## @var template
    # The output template
    template = \
    '''\
    {
        "topLeft":
        { 
            "lat": %s,
            "lng": %s
        },
        "botRight":
        {
            "lat": %s,
            "lng": %s
        },
        "filename": "%s",
		"city": "%s",
		"region": "%s"
    }'''
    
    reginapoints = generate_jsonpoll_regina('ReginaCityLimits.kml')
    # Return value in Min Lat, Min Lon, Max Lon, Max Lat
    minlon = float(reginapoints[0])
    minlat = float(reginapoints[1])
    maxlon = float(reginapoints[2])
    maxlat = float(reginapoints[3])
    
    # Add to the list
    inneroutput.append(template % (maxlat, minlon, minlat, maxlon,
        'regina_polls.json', 'Regina', 'SK'))
    
    saskatoonpoints = generate_jsonpoll_saskatoon(
            'SaskatoonElection2012.kml')
    
    # Return value in Min Lat, Min Lon, Max Lon, Max Lat
    minlon = float(saskatoonpoints[0])
    minlat = float(saskatoonpoints[1])
    maxlon = float(saskatoonpoints[2])
    maxlat = float(saskatoonpoints[3])
    
    # Add to the list
    inneroutput.append(template % (maxlat, minlon, minlat, maxlon,
        'saskatoon_polls.json', 'Saskatoon', 'SK'))
    
    # Join the output and comma separate, also needed for no trailing comma
    output += ''',
'''.join(inneroutput)

    #output += inneroutput
    # the tail of the JSON output file
    output += '''
]
'''

    ## @var outFileHandle
    #  Output the contents to the JSON output file
    outFileHandle = open(outfile, 'w')
    outFileHandle.write(output)
    outFileHandle.close()

def generate_polls_saskatoon(infile, outfile):
    """@brief Generate Saskatoon Polls Output Routine
    @param infile Input File
    @param outfile Output File"""
    
    from xml.dom.minidom import parseString
    
    ## @var template
    # the template. where data from the csv will be formatted to geojson
    # FIXME: poll, ward and address are not known from the source file
    template = \
    '''\
    {   
        "poll" : %s,
        "ward" : %s,
        "address" : "%s",
        "est18_2012" : "%s",
        "geometry" : 
        {
            "type" : "Point",
            "coordinates" : [%s,%s]
        },
        "properties" : 
        {
            "entityid" : "%s", 
            "name" : "%s"
        }
    }'''
    
    ## @var output
    # The output to write to the output file
    output = '''[
'''
    
    ## @var inneroutput
    # The running inner output to join and comma separate later
    inneroutput = []
    
    ## @var fh
    # The file handle to the City Limits XML/KML file
    fh = open(infile, 'r')
    ## @var data
    # Contains the file contents
    data = fh.read()
    if(fh):
        fh.close()
    ## @var dom
    # Contains the DOM object contents
    dom = parseString(data)
    ## @var placemark
    # This data is obtained on a per row basis from the input KML/XML file
    for placemark in dom.getElementsByTagName('Placemark'):
        ## @var name
        # Contains the name for this Saskatoon voting location
        name = placemark.getElementsByTagName('name')[0].firstChild.nodeValue
        # Sanitize for 'St. Paul School' in Saskatoon's Open Data dataset
        # Does not negatively affect the other results
        name = name.split('\n')[0]
        ## @var point
        # Contains the Point data from this row entry
        point = placemark.getElementsByTagName('Point')[0]
        ## @var coordinates
        # Contains the coordinates XML Element
        coordinates = point.getElementsByTagName('coordinates')[0]
        ## @var coord
        # Parse the above coordinates and split into a "long, lat, alt" array
        coord = coordinates.firstChild.nodeValue.encode('utf-8').split(',')
        ## @var lon
        # Contains the longitude value for this polling station
        lon = coord[0]
        ## @var lat
        # Contains the latitude value for this polling station
        lat = coord[1]
        
        # @todo fix once these values can be obtained from the source inputs
        poll = 0
        ward = 0
        address = ""
        est18_2012 = ""
        entityid = ""
        
        inneroutput.append(template % (poll, ward, address, est18_2012, 
                    lat, lon, entityid, name))
    
    # Join the output and comma separate, also needed for no trailing comma
    output += ''',
'''.join(inneroutput)
            
    # the tail of the JSON output file
    output += '''
]
'''

    ## @var outFileHandle
    # Output the contents to the JSON output file
    outFileHandle = open(outfile, 'w')
    outFileHandle.write(output.encode('utf-8'))
    outFileHandle.close()
    
def generate_polls_regina(infile, outfile):
    """@brief Generate Regina Polls Output Routine
    @param infile Input File
    @param outfile Output File"""
    
    import csv

    ## @var rawData
    # Read in raw data from csv
    rawData = csv.reader(open(infile, 'rb'), dialect='excel')

    ## @var template
    # the template. where data from the csv will be formatted to geojson
    template = \
    '''\
    {   
            "poll" : %s,
            "ward" : %s,
            "address" : "%s",
            "est18_2012" : "%s",
            "geometry" : {
                "type" : "Point",
                "coordinates" : [%s,%s]},
                "properties" : { "entityid" : "%s", 
                    "name" : "%s" }
    }'''
    
    ## @var output
    # The output to write to the output file
    output = '''[
'''

    ## @var iter
    # loop through the csv by row skipping the first
    iter = 0
    
    ## @var inneroutput
    # The running inner output to join and comma separate later
    inneroutput = []
    
    for row in rawData:
        iter += 1
        if iter >= 2:
            entityid = row[0]
            poll = row[1]
            name = row[2]
            address = row[3]
            est18_2012 = row[4]
            ward = row[5]
            lon = row[6]
            lat = row[7]
            inneroutput.append(template % (poll, ward, address, est18_2012, 
                    lat, lon, entityid, name))
                    
    # Join the output and comma separate, also needed for no trailing comma
    output += ''',
'''.join(inneroutput)
            
    # the tail of the JSON output file
    output += '''
]
'''

    ## @var outFileHandle
    # Output the contents to the JSON output file
    outFileHandle = open(outfile, 'w')
    outFileHandle.write(output)
    outFileHandle.close()

def main():
    """@brief Main Function"""
    
    # Generate the reginapolls.geojson output file (from CSV)
    generate_polls_regina('ReginaPollStations2012.csv', 'regina_polls.json')
    
    # From XML/KML since there is CSV source for Saskatoon Polling Station data
    generate_polls_saskatoon('SaskatoonPollingStations2012.kml', 
        'saskatoon_polls.json')
    
    # From XML/KML since the CSV source does not have coordinates
    generate_jsonpolls('poll_table.json')
    
    # Generate the JSON Wards Files
    generate_jsonwards()

if __name__ == '__main__':
    """  @brief Runs the CSV To GeoJSON Routines."""
    main()
