"""
@name Python Roman Numeral
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

def main():
    """@brief Man Function Routine"""
    import csv

    ## @var rawData
    # Read in raw data from csv
    rawData = csv.reader(open('PollStations2012.csv', 'rb'), dialect='excel')

    ## @var template
    # the template. where data from the csv will be formatted to geojson
    template = \
    '''\
{   
            "poll" : %s,
            "est18_2012" : "%s",
            "geometry" : {
                "type" : "Point",
                "coordinates" : ["%s","%s"]},
                "properties" : { "entityid" : "%s", "name" : "%s", }
},
    '''

    ## @var output
    # The output to write to the output file
    output = \
    ''' \
[ 
    '''
    # the head of the geojson file
    #output = \
    #    ''' \
    #{ "type" : "Feature Collection",
    #    {"features" : [
    #    '''

    ## @var iter
    # loop through the csv by row skipping the first
    iter = 0
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
            output += template % (poll, est18_2012, lat, lon, entityid, name)
            
    # the tail of the geojson file
    output += \
        ''' \
]}'''

    # opens an geoJSON file to write the output to
    ## @var outFileHandle
    # The output file containing the GEO JSON contents
    outFileHandle = open("reginapolls.geojson", "w")
    outFileHandle.write(output)
    outFileHandle.close()

if __name__ == "__main__":
    """  @brief Example code that utilizes both conversion routines."""
    main()
