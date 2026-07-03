import urllib.request
import json
import sys

queries = [
    ("Kho Gaye Hum Kahan", "Prateek Kuhad"),
    ("Alag Aasmaan", "Anuv Jain"),
    ("Channa Mereya", "Arijit Singh"),
    ("Bags", "Clairo"),
    ("Vanilla", "dhruv"),
    ("Starboy", "The Weeknd"),
    ("Levitating", "Dua Lipa"),
    ("Someone Like You", "Adele"),
    ("Fix You", "Coldplay"),
    ("Lovers Rock", "TV Girl"),
    ("Sweater Weather", "The Neighbourhood"),
    ("Midnight City", "M83"),
    ("Lofi chill", "lofi"),
    ("Nightcall", "Kavinsky"),
    ("Watermelon Sugar", "Harry Styles")
]

for title, artist in queries:
    term = urllib.parse.quote(f"{title} {artist}")
    url = f"https://itunes.apple.com/search?term={term}&entity=song&limit=1&country=IN"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read())
            if data['resultCount'] > 0:
                r = data['results'][0]
                art = r.get('artworkUrl100', '').replace('100x100bb', '600x600bb')
                prev = r.get('previewUrl', '')
                print(f"{{ title: '{title}', artist: '{artist}', preview_url: '{prev}', artwork_url: '{art}' }},")
    except Exception as e:
        print(f"Failed {title}: {e}")
