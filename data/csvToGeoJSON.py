"""
@name Python Roman Numeral CSV GeoJSON/JSON File
@file csvToGeoJSON.py
@author Andrew Dyck
@author Daniel Pronych
@date October 2012
@version 1.0.0

Convert CSVToGeoJSON for PollStations2012.csv obtained from the City of Regina Open Data 
website located at: http://openregina.cloudapp.net/DataBrowser/OpenRegina/

Original File: https://github.com/andrewjdyck/infantProjects/blob/master/csvToGeoJSON/csvToGeoJSON.py
Original Date File Was Obtained: October 20, 2012
"""

## @var __author__
#Script Author
__author__ = 'Andrew Dyck; Daniel Pronych'

## @var __version__
# Script Release Version
__version__ = '1.0.0'

def generate_jsonpolls(infile, outfile):
    """@brief Generate Regina Polls Output Routine
    @param infile Input File
    @param outfile Output File
    @todo Finish the data and then the generation routine."""
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
    ## @var output
    # The output to write to the output file
    output = \
    '''\
[
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
        "filename": "%s"
    }
]
''' % (maxlat, minlon, minlat, maxlon, 'regina_polls.json')
    
    ## @var outFileHandle
    #  Output the contents to the JSON output file
    outFileHandle = open(outfile, 'w')
    outFileHandle.write(output)
    outFileHandle.close()
    
def generate_reginapolls(infile, outfile):
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
    generate_reginapolls('ReginaPollStations2012.csv', 'regina_polls.json')
    
    # From XML/KML since the CSV source does not have coordinates
    # Rename output file when working to not modify the working file
    generate_jsonpolls('ReginaCityLimits.kml','poll_table.json')

if __name__ == '__main__':
    """  @brief Runs the CSV To GeoJSON Routines."""
    main()
