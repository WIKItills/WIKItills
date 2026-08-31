import os
import json
import requests
from bs4 import BeautifulSoup
from datetime import datetime, timedelta

def main():
    username = os.environ.get("GH_PROFILE_USER", "WIKItills")
    url = f"https://github.com/users/{username}/contributions"
    print(f"Fetching contributions from {url}")
    
    response = requests.get(url)
    if response.status_code != 200:
        print(f"Failed to fetch {url}: {response.status_code}")
        return
    
    soup = BeautifulSoup(response.text, "html.parser")
    cells = soup.find_all("td", class_="ContributionCalendar-day")
    
    contributions = []
    total_contributions = 0
    current_streak = 0
    longest_streak = 0
    best_day = 0
    
    for cell in cells:
        date_str = cell.get("data-date")
        if not date_str:
            continue
            
        tooltip_id = cell.get("id")
        tooltip = soup.find("tool-tip", {"for": tooltip_id}) if tooltip_id else None
        
        count = 0
        if tooltip:
            text = tooltip.text.strip()
            if text.startswith("No contributions"):
                count = 0
            else:
                try:
                    count_str = text.split(" ")[0]
                    count = int(count_str.replace(",", ""))
                except:
                    pass
        
        contributions.append({
            "date": date_str,
            "count": count
        })
        
        total_contributions += count
        if count > 0:
            current_streak += 1
            if current_streak > longest_streak:
                longest_streak = current_streak
        else:
            current_streak = 0
            
        if count > best_day:
            best_day = count
            
    # Calculate streaks properly by iterating backwards if needed
    # but the simple loop above gives a basic estimation. Let's do it correctly:
    
    current_streak = 0
    longest_streak = 0
    temp_streak = 0
    
    for c in contributions:
        if c["count"] > 0:
            temp_streak += 1
            if temp_streak > longest_streak:
                longest_streak = temp_streak
        else:
            temp_streak = 0
            
    # For current streak, count backwards from today
    # Assuming the last item in contributions is today
    for c in reversed(contributions):
        if c["count"] > 0:
            current_streak += 1
        else:
            break
            
    data = {
        "total_contributions": total_contributions,
        "current_streak": current_streak,
        "longest_streak": longest_streak,
        "best_day": best_day,
        "contributions": contributions
    }
    
    os.makedirs("data", exist_ok=True)
    with open("data/contributions.json", "w") as f:
        json.dump(data, f, indent=2)
        
    print(f"Saved {len(contributions)} days of contributions.")
    print(f"Total: {total_contributions}, Longest Streak: {longest_streak}, Current Streak: {current_streak}, Best Day: {best_day}")

if __name__ == "__main__":
    main()
