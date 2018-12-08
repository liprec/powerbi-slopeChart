# Power BI Slope Chart

![](assets/SlopeChart.png)

# Overview


See also [Slope chart at Microsoft Office store]()

# Build
Some changes are needed before this visual can be build:

Changes to `.api/v1.13.0/schema.capablities.json`:

Replace row 95:
```
},
"cartesianKind": {
    "type": "number",
    "description" : "The cartesion kind for analytical support"
}
```
Replace (now) row 1019:
```
},
"fontFamily": {
    "type": "boolean",
    "description": "Displays a selector to allow the user to font family"
}
```

Replace (now) row 1041:
```
},
{
    "required": [
        "fontFamily"
    ]
}
```