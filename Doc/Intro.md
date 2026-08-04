A hyperlocal skill-sharing platform that fights two problems at once: loneliness and the loss of everyday practical skills (cooking, gardening, repairs, sewing, digital literacy, etc.). Instead of asking "who are you?" like typical social apps, it starts with "what can you teach/learn?" — connection becomes a byproduct of doing something together, not the explicit goal.

This pivot to web (your actual stack: React/Node/Express/Mongo/TS) makes sense for scope/cost — no app store friction, and Leaflet+OSM avoids Google Maps API billing.  
Three user roles: Guest, Registered User, Admin/Moderator

Core modules:  
Auth (JWT-based)  
Skill management (add skills to teach/learn, browse/filter)  
Discovery (map-based, hyperlocal search)  
Connection (skill requests → accept/reject → chat)  
Interaction (in-app chat via Socket.io, ratings/reviews after sessions)  
Trust & Safety (reporting, moderation dashboard, reviews)
