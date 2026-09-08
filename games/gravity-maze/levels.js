(function(root){'use strict';const levels=[
  {
    "id": "mass-6",
    "name": "Stuur het gewicht vooruit",
    "grid": [
      "################",
      "#..............#",
      "#.......#...E..#",
      "#......#..>....Q",
      "#....#....#....Q",
      "#....v.......S.#",
      "P...........M..#",
      "P.........<.<..#",
      "################"
    ],
    "family": "Massa en vaste naden",
    "goal": "Bereik de uitgang. Dezelfde zwaartekracht verplaatst jullie allebei.",
    "hints": [
      "Kijk waar de steen bij de volgende twee wissels terechtkomt.",
      "Je kunt de steen niet duwen. Zoek een pijl die een bruikbare steunplaats maakt."
    ],
    "spatialVersion": 1,
    "composition": {
      "kind": "recompose-and-contract",
      "source": {
        "cuts": [
          2,
          2,
          2
        ],
        "remove": 1,
        "dir": 0
      },
      "removedWalls": [
        [
          9,
          1
        ],
        [
          10,
          1
        ],
        [
          6,
          2
        ],
        [
          7,
          2
        ],
        [
          11,
          2
        ],
        [
          2,
          4
        ],
        [
          3,
          4
        ],
        [
          4,
          4
        ],
        [
          9,
          4
        ]
      ]
    }
  },
  {
    "id": "h1",
    "name": "De twee richels",
    "family": "Expert candidate",
    "goal": "Bereik de uitgang.",
    "hints": [
      "Welke steen kan na een andere voorbereiding boven komen?",
      "De nabije rechterpijl kan later een andere functie krijgen."
    ],
    "grid": [
      "##################",
      "#..........####..#",
      "#......#>S.......#",
      "#........M.......#",
      "##...#...........#",
      "#.....#..N......##",
      "#..#....#.......E#",
      "#.......##.####<.#",
      "#......<.^.......#",
      "##################"
    ],
    "spatialVersion": 1,
    "composition": {
      "kind": "redistribute-support-zones",
      "cuts": [
        2,
        3,
        9,
        9,
        9
      ],
      "removedWalls": [
        [
          4,
          4
        ],
        [
          2,
          6
        ]
      ]
    }
  },
  {
    "id": "h2",
    "name": "De oversteek",
    "family": "Expert candidate",
    "goal": "Bereik de uitgang.",
    "hints": [
      "Bekijk ook de vrije ruimte aan de andere portalopening.",
      "De hoogte waarop je terugkomt bepaalt waar je uitkomt."
    ],
    "grid": [
      "##################",
      "###....#.........#",
      "#....<.##........#",
      "#.....S.#......#.#",
      "#.....#..........#",
      "#................Q",
      "#....<.#......#.EQ",
      "PM...#..<........#",
      "P.....^..........#",
      "##################"
    ],
    "spatialVersion": 1,
    "composition": {
      "kind": "redistribute-support-zones",
      "cuts": [
        3,
        3,
        7,
        8,
        9
      ],
      "removedWalls": [
        [
          13,
          6
        ],
        [
          3,
          7
        ],
        [
          4,
          7
        ]
      ]
    }
  },
  {
    "id": "h3",
    "name": "De hoge omweg",
    "hints": [
      "Waar moet de steen liggen voordat je weer omlaag gaat?",
      "Bereid eerst de rechterkant voor; de nabije linkerpijl verandert die voorbereiding."
    ],
    "family": "Nieuwe kamer",
    "goal": "Bereik de uitgang.",
    "grid": [
      "##################",
      "##...........#v..#",
      "#....S..<..>.....#",
      "#.######....M....#",
      "#................#",
      "#...........#.#..#",
      "#.............E..#",
      "#........####....#",
      "#...........^....#",
      "##################"
    ],
    "spatialVersion": 1,
    "composition": {
      "kind": "redistribute-support-zones",
      "cuts": [
        2,
        3,
        4,
        6,
        6
      ],
      "removedWalls": []
    }
  },
  {
    "id": "h4",
    "name": "De dubbele wand",
    "hints": [
      "Waar eindigen beide stenen als je de rechterpijl nu gebruikt?",
      "Dezelfde twee stenen kunnen eerst uit elkaar gaan en later samen een zijwand maken."
    ],
    "family": "Nieuwe kamer",
    "goal": "Bereik de uitgang.",
    "grid": [
      "##################",
      "#....#...##..<...#",
      "#>...S...........#",
      "#.####.....N.....#",
      "#................#",
      "#.#..#.....M....##",
      "##...............#",
      "#......######....#",
      "##......^.......E#",
      "##################"
    ],
    "spatialVersion": 1,
    "composition": {
      "kind": "redistribute-support-zones",
      "cuts": [
        2,
        3,
        5,
        6,
        10
      ],
      "removedWalls": [
        [
          4,
          1
        ],
        [
          3,
          5
        ],
        [
          4,
          5
        ]
      ]
    }
  },
  {
    "id": "h5",
    "name": "De wisselkamer",
    "hints": [
      "Twee pijlen met dezelfde richting hoeven niet dezelfde opstelling op te leveren.",
      "Ook jouw plek bepaalt hoe ver de stenen uit de portal kunnen komen."
    ],
    "family": "Nieuwe kamer",
    "goal": "Bereik de uitgang.",
    "grid": [
      "################",
      "#...M......N...Q",
      "#.#............Q",
      "#...##....##...#",
      "PE..v.S...#....#",
      "P..>..#<...#..##",
      "#..##.#........#",
      "#..>......#...##",
      "################"
    ],
    "spatialVersion": 1,
    "composition": {
      "kind": "recompose-and-contract",
      "source": {
        "cuts": [
          10,
          11
        ],
        "remove": 4,
        "dir": 0
      },
      "removedWalls": [
        [
          8,
          3
        ],
        [
          14,
          4
        ]
      ]
    }
  },
  {
    "id": "t2-1",
    "name": "De tussensteiger",
    "hints": [
      "Welke steun geeft toegang tot de laatste pijl?",
      "De eerste oversteek bouwt nog niet de eindwereld."
    ],
    "tier": 2,
    "candidate": true,
    "family": "Tier-2-kandidaat",
    "goal": "Bereik de uitgang.",
    "grid": [
      "################",
      "#.......##.#...#",
      "#.....<S....E#.#",
      "#......#..>....#",
      "#..............Q",
      "#.......#..##..Q",
      "PM....#....#...#",
      "P......^.#<....#",
      "################"
    ],
    "spatialVersion": 1,
    "composition": {
      "kind": "recompose-and-contract",
      "source": {
        "cuts": [
          2,
          2,
          2
        ],
        "remove": 1,
        "dir": 0
      },
      "removedWalls": []
    }
  },
  {
    "id": "t2-2",
    "name": "De omkeer",
    "hints": [
      "De steen moet terugkomen, maar jij moet dan aan de andere kant staan.",
      "De nabije exit vraagt eerst een bruikbare tussenwereld rechts."
    ],
    "tier": 2,
    "candidate": true,
    "family": "Tier-2-kandidaat",
    "goal": "Bereik de uitgang.",
    "grid": [
      "##################",
      "#.......#..####.##",
      "#.....#E>.S.....##",
      "#........M.......#",
      "#....#...........#",
      "##..#####N.....<.#",
      "#..#.............#",
      "#..#...###.####<.#",
      "#........^.......#",
      "##################"
    ],
    "spatialVersion": 1,
    "composition": {
      "kind": "redistribute-support-zones",
      "cuts": [
        2,
        3,
        9,
        9,
        9
      ],
      "removedWalls": [
        [
          4,
          4
        ],
        [
          2,
          6
        ],
        [
          2,
          7
        ]
      ]
    }
  },
  {
    "id": "t2-3",
    "name": "De tweede doorgang",
    "hints": [
      "Bekijk niet alleen de brug, maar ook welke pijlen op de terugweg nog actief zijn.",
      "De eerste brug geeft toegang tot het bouwen van de tweede."
    ],
    "tier": 2,
    "candidate": true,
    "family": "Tier-2-kandidaat",
    "goal": "Bereik de uitgang.",
    "grid": [
      "################",
      "##.........E...#",
      "#..........#>.##",
      "#..............Q",
      "#.........#...<Q",
      "#..v.....M.....#",
      "P..............#",
      "P.........S<...#",
      "################"
    ],
    "spatialVersion": 1,
    "composition": {
      "kind": "recompose-and-contract",
      "source": {
        "cuts": [
          4,
          4,
          4
        ],
        "remove": 1,
        "dir": 0
      },
      "removedWalls": []
    }
  }
];const api={levels};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.GravityLevels=api;})(typeof globalThis!=='undefined'?globalThis:this);
