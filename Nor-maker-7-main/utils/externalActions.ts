import { ActionDefinition } from "./actionLibrary";

export const EXTERNAL_ACTIONS: ActionDefinition[] = [
  {
    id: "ext_move_999_1",
    name: "Move",
    description: "Move action",
    category: "move",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAATUlEQVR4nO3WzQkAIAyD0Qzf2bpWRQfwBwwifA255fCOlaRytjSPxshwEXEGyMyrBQAAAAAAAAAAAPAXoI8d3QY8fctXA3cAAADwHNAA1Q8YAMbbG0AAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Move (not implemented)\n`;
    }
  },
  {
    id: "ext_move_101",
    name: "Move Fixed",
    description: "Start moving in a direction",
    category: "move",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABCElEQVR4nO2WUQqDMAyGewi9mhfw2TPo0XqQMfB5g73svSODQJfGpLYpZaDlB9E0+axJWuecCy0VnDzgCvu+m2vbtnMA3ntVt2H4Kse2COA+jj+iwV/rGh7znEBw84oBnsuSBKcBQBxEPLdqBd7TlEDge3h39NxkBahDDYDaVgFIjjkAabVMqoD7OgSQglcBcMkV/1+854LHc4sAwIGUfDlJihCnAbDOMQAVlwucDfgAX0UA0GS4mqeNSbLBRvV/vyAnCTWI6iTUypArSfMylJrMUTKaNSLt66T2bNKKtSTTNqlm2zEeRKgohNl23O1AoqnZkQyMWygboOuxXDNoPS6AC+AC6A7wAYtdGofgS7UzAAAAAElFTkSuQmCC",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Move Fixed (not implemented)\n`;
    }
  },
  {
    id: "ext_move_102",
    name: "Move Free",
    description: "Set direction and speed of motion",
    category: "move",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAA70lEQVR4nO2W3wkDIQzGs0qH6BZdqG+u0S06glP03ZeuYfEgIJJ8sRo5WjwJ3J9ofnpfokREeaVlwq1cOaXkbiGE7wBijKbR9XlYj+8QAAeQApXn2+OdL/eX+K3tNwzQE0ADrPtOrYAEUQfR3rusgLUSLUDrOwWABpYA0Gq5ZIE0OwZAwacAkLjqe+0XuaShJTIk0mENcJ5zgNYkLUg+PMYQQD1LlPfIh8f4vV/QI0ILYlqEVhpKKemehqjIaGJ0K0TW7FB5dinFlsisTep/tmMtwPIDiWVanZjOguK8wroBTj2WWw6r2wbYABvgdIAPmtb8EGMCeWYAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Move Free (not implemented)\n`;
    }
  },
  {
    id: "ext_move_105",
    name: "Move Towards",
    description: "Move towards point (@0,@1)",
    category: "move",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAzElEQVR4nGNgYGD4T0v8nwE/BIH/Dx8+pDpuaGggzQEHDhygKh5ZDmAwmAPGA+IAmOXojhg5DqBLFJzcvPn/PVFRrJiuifBSTjbY0vdAwz+0tNDfAWebmyAOqKn5/yY3l74OgFn+JSyM/lGAbvm58rL/l7Kz6eMAbJbD5G4pKoLpY8ePgTHVHYDPcljuoFkIoFt+tqGepLKBIgdQajlFDqCG5RQ5gBqWU+wASi2nejkw/B0AUkwLTLQDBrRZTkgBreGoA0YdMOqAAXcAACN+pC1lwPzyAAAAAElFTkSuQmCC",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Move Towards (not implemented)\n`;
    }
  },
  {
    id: "ext_move_103",
    name: "Speed Horizontal",
    description: "Set the horizontal speed",
    category: "move",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAA+ElEQVR4nGNgYGD4T0v8nwE/BIH/Dx8+pDpuaGggzQEHDhygKh51wPB2wD1R0YF3ACFH0N4BEhJ4HUF1ByD7GkR/aG7+/0hDA6cjqOIAZEvfZWcjHAD0/ce2NjB+YmSE1RFkOwDZ0tfh4XD2m6QkjBAAOeDTxIn/nzs5YTiCIgc8MTEBs1/6+uJ0wPvKSrAjQA4A4WfW1iiOoEoIvHB1xemAt3l5cEdQNQRwpYHXEREIB4iL/3+TkgJ2BNXTALG54FVU1P8HCgq0zQV4HQMMBbqWA4OuJCSkZnjXhsPPASDFtMBEO2BAm+WEFNAajjpg1AGjDhhwBwAA3lKgPSAVyWAAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Speed Horizontal (not implemented)\n`;
    }
  },
  {
    id: "ext_move_104",
    name: "Speed Vertical",
    description: "Set the vertical speed",
    category: "move",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAA70lEQVR4nGNgYGD4T0v8nwE/BIH/Dx8+pDpuaGggzQEHDhygKh5+DrgnKgrHA+aAJyYmA+eAAY0CkK9fuLr+f+nr+/91eDhRoUB1B6DjkRMFIN++joj4/yYpCY7fZWcTDAWqOgAXHr5RgOFbcXFUvoQEwdCgOARgFr+Kivr/JiXl/9u8vP/vKyv/f2hu/v+xrQ1MwxxCsygAGf5AQQHDchB+pKGBNx1QNRE+MTICW/5p4kQwBvHpmghBlj13cgJbDqIHpCACWfrM2npgKyNiLR/65QDdHQBSTAtMtAMGtFlOSAGt4agDRh0w6oABdwAAN/KgPeomWOAAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Speed Vertical (not implemented)\n`;
    }
  },
  {
    id: "ext_move_107",
    name: "Set Gravity",
    description: "Set the gravity",
    category: "move",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAA7klEQVR4nGNgYGD4T0v8nwE/BIH/Dx8+pDpuaGggzQEHDhygKqa6AxgM5sDxgDkgeumbgXWAz8xn9HcActCb9T8gOiqoGgIgy3hTTv5Xqb/5X6v+OlGhQJMoEMw4PXBpAOaIAcuGpGKqpwF0THcHeE17/j9o3vP/UcveD4wDLPvuwR0xIA4wBDoA5gi6OAA9zjXb7kEcAXKABeH0QJUQABnO5Lnlv0Thtf+KlddQHMETuB1vSFC1KEZ3BFcAfstpkgaYvbeBHcHuu23gimKQI0aLYpo4AKSYFphoBwxos5yQAlrDUQeMOmDUAQPuAADLw44BMTuyywAAAABJRU5ErkJggg==",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Set Gravity (not implemented)\n`;
    }
  },
  {
    id: "ext_move_113",
    name: "Reverse Horizontal",
    description: "Reverse horizontal direction",
    category: "move",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABDUlEQVR4nGNgYGD4T0v8nwE/BIH/Dx8+pDpuaGggzQEHDhygKh5eDrgjIjJwDgBZfk9UdGAcALL8fX39wDgAZjnMAdfU1THwY2mZ/+cjI6nvAJDlr5OT/39oafn/sbPz/7uSkv9fwsKw4rfMzP8vJCbRJgRAjgBhUAjc5OLGwFeEhMCOeAw044ayCm3SAMwBuOL6REY62BHoOYWquQBfNjy2fBltHUCoHDg+aybtHYAPH9mxY2AdALIY5IAzHh7UzYbEYpjvT7W2UNcBuPI9OgapPVta8v/kyhX0DYEbQH2gYD9TWfn/xMYN1C+IKMWjDhhaDgAppgUm2gED2iwnpIDWcNQBow4YdcCAOwAAdTCKBngvsTEAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Reverse Horizontal (not implemented)\n`;
    }
  },
  {
    id: "ext_move_114",
    name: "Reverse Vertical",
    description: "Reverse vertical direction",
    category: "move",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABDklEQVR4nGNgYGD4T0v8nwE/BIH/Dx8+pDpuaGggzQEHDhygKh51AFUdcENZ5f8dEREUfMbD4/+p1pb/J1euoK0DLiQm/X8MVPMlLAwDgxxytrTk/4mNG2jjgPORkf/fMjODLTuRkf7/2PJl/4/Pmvn/yI4dYMthjjhTWUkbBzyWlvn/JTn5/xUhIazyMEeAooMmDrimrg624CYXN14H3ACaMaAOANGjDhg+DgAZdk9UFI7flZTA2bBCiOYhADLwfX09GH/s7Pz/GpgVQRjdIppGAcwRH1pasFpOlzQAMhiX5XRxAMwSfHLo6YLqDiAXjzqAJAeAFNMCE+2AAW2WE1JAazjqgFEHjDpgwB0AAE4NiiCi+d1MAAAAAElFTkSuQmCC",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Reverse Vertical (not implemented)\n`;
    }
  },
  {
    id: "ext_move_108",
    name: "Set Friction",
    description: "Set the friction",
    category: "move",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAA2klEQVR4nO3WMQqDMBQG4FzCC3kINxdxEFFxcHETBMHRG+UkBacuWrVkf2pKi4o0NSZNKTH8ZHhv+PLQIEIIgcwAer/mB+q6Fp4sy44BMMZCowH/AbgYhnoAL0IY4GqaTMRenQvwPPEyQ1EwEXuT4gZ0cfxIktD0eb6L2EK7IFjVuQGN40DreTS3MIQuTSniXlUrxLwTywLiukCm3qEsoff9V/0UYJk2iiiCOQHbFjOBbZrphF97B5R/BT95Dyi9Cc9EAzTgEGBulpGPAUp/y1kNspcGaIAGKAeMssKhDtHUy2gAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Set Friction (not implemented)\n`;
    }
  },
  {
    id: "ext_move_999_2",
    name: "-------------",
    description: "------------- action",
    category: "move",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAATUlEQVR4nO3WzQkAIAyD0Qzf2bpWRQfwBwwifA255fCOlaRytjSPxshwEXEGyMyrBQAAAAAAAAAAAPAXoI8d3QY8fctXA3cAAADwHNAA1Q8YAMbbG0AAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: ------------- (not implemented)\n`;
    }
  },
  {
    id: "ext_move_999_3_2",
    name: "Jump",
    description: "Jump action",
    category: "move",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAATUlEQVR4nO3WzQkAIAyD0Qzf2bpWRQfwBwwifA255fCOlaRytjSPxshwEXEGyMyrBQAAAAAAAAAAAPAXoI8d3QY8fctXA3cAAADwHNAA1Q8YAMbbG0AAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Jump (not implemented)\n`;
    }
  },
  {
    id: "ext_move_109",
    name: "Jump to Position",
    description: "Jump to position (@0,@1)",
    category: "move",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABZUlEQVR4nGNgYGD4T0v8nwE/BIH/Dx8+pDpuaGggzQEHDhygKqa6A06uWf3/KTf3/zusrGD8nIvr/w1lFdo7AGTxfaCaL2FhGPgxUPxCYhLtHACy/AHU8nPCwv+P7Njx//ismf+PLV/2/0RGOlj8LTPz//ORkdR3ALLPQZZjc+AVIaH/X5KT/z+WlqG+A24QsByEb3Jxg9VcU1enrgNOTJ4INvi+mxuGwXdERMD4nqgoGL8rKYGzQRgkR7EDLgsI4vU9yJLXwKAH4Y+dnf/f19eDMcxyihxwJj8fnsovpKTgDH6YIz60tGBYTpEDrpibgy0/Ly5OsGyAOQLdcooccNnIiGDiQ3cEVcuBK5ycRDmAwWAOXj7ZDgBZDMOEfA+zFN1yqpWExGBslpPtAELBSpcQwGcoXdIAMZYTg2keAjRxAKlpgCYhQC1MkgNAimmBiXbAgDbLCSmgNRx1wKgDRh0w4A4AABtIhPu73Fe3AAAAAElFTkSuQmCC",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Jump to Position (not implemented)\n`;
    }
  },
  {
    id: "ext_move_110",
    name: "Jump to Start",
    description: "Jump to the start position",
    category: "move",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABwElEQVR4nGNgYGD4T0v8nwE/BIH/Dx8+pDpuaGggzQEHDhygKqa6A06uWf3/KTf3/zusrGD8nIvr/w1lFdo7AGTxfaCaL2FhGPgxUPxCYhLtHACy/AHU8nPCwv+P7Njx//ismf+PLV/2/0RGOlj8LTPz//ORkdR3ALLPQZZjc+AVIaH/X5KT/z+WlqG+A24QsByEb3Jxg9VcU1enrgNOTJ4INvi+mxuGwXdERMD4nqgoGL8rKYGzQRgkR7EDLgsI4vU9yJLXwKAH4Y+dnf/f19eDMcxyihxwJj8fnsovpKTgDH6YIz60tGBYTpEDrpibgy0/Ly7+/9jxYyiGovNhjkC3nCIHXDYyIpj40B1B1XLgCicnSQ44NksCjKnmAJDFMEyM5f9vlvz//6AKwxE0r4zAll/PA1v+/03r//8vG1EcQZYDGAzmoFiCzsdwwO3S//+f1/////MoEB+k3AHIluKzHOyAPbMhjnjd8v//n2WQtAAUo0oUELIchndu6IEnQmTL6RICILxy9er/OZPn//fz86NOLiAlDYDwtu3bwJZTzQHUxCQ5AKSYFphoBwxos5yQAlrDUQeMOmDUAQPuAAAt84VzCZetmAAAAABJRU5ErkJggg==",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Jump to Start (not implemented)\n`;
    }
  },
  {
    id: "ext_move_111",
    name: "Jump to Random",
    description: "Jump to a random position",
    category: "move",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABn0lEQVR4nGNgYGD4T0v8nwE/BIH/Dx8+pDpuaGggzQEHDhygKqa6A06uWf3/KTf3/zusrGD8nIvr/w1lFdo7AGTxfaCaL2FhGPgxUPxCYhLtHACy/AHU8nPCwv+P7Njx//ismf+PLV/2/0RGOlj8LTPz//ORkdR3ALLPQZZjc+AVIaH/X5KT/z+WlqG+A24QsByEb3Jxg9VcU1enrgNOTJ4INvi+mxuGwXdERMD4nqgoGL8rKYGzQRgkR7EDLgsI4vU9yJLXwKAH4Y+dnf/f19eDMcxyihxwJj8fnsovpKTgDH6YIz60tGBYTpEDrpibgy0/Ly5OsGyAOQLdcooccNnIiGDiQ3cEVcuBK5ycJDmA6iUhyGIYxmfBjJnb/zMYzIHjqdO2/T92/Bh1S0J8GGRpZ+cmMLutbSOYT7EDQIagW0KMY5Yu3Y2hluwQgBlErOUrVu4Bq+3p2UwdB5BiOUxtTe1a6iVCUkNg+46DYEwVB5CTBkBqgoPnUy8ESMWLFu8CY4ocAFJMC0y0Awa0WU5IAa3hqANGHTDqgAF3AADueIBRL2hOiwAAAABJRU5ErkJggg==",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Jump to Random (not implemented)\n`;
    }
  },
  {
    id: "ext_move_117",
    name: "Align to Grid",
    description: "Align to a grid of @0 by @1",
    category: "move",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAZElEQVR4nO3W0QnAMAgE0BupIzpIhnEVJzG4QNqUk9BykfsISHiIHwGA7ExiXXUyIugxsz2Au1MjAAWAa2zdBaAA6tG3+ccEBNAOCKAdEICVbwGquSOPAUe/5XcN3SWAAAIcB0xhhXWvLuaPxQAAAABJRU5ErkJggg==",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Align to Grid (not implemented)\n`;
    }
  },
  {
    id: "ext_move_112",
    name: "Wrap Screen",
    description: "Wrap @0 when outside",
    category: "move",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABEUlEQVR4nO2Wyw2CQBCGtxu40QChABsgHOBEBzRAG3TDxZN341ESNb56GP1NxuhmwQX2kRjY/Cdmdr7MC4QQgmyKxPDBQ13XGVdd1+MA2rY1KuMA2yDwB4Dgp9WKNlXlHgDBz2lK1zyn+xPimCS0bhr3GdiH4SswAHZZ5q8HUAadLFibAqcACKISA7CMA+BS1BmBdARbGWQWAF+MdKskv2N7IwC4EOPWl1pVD7DP556YBMALBzOPsVNtPxkANl0U0a0s6RDHb5/JGeDF07d6VRmA7aUovnxm9cDQ3u8bQ9nnvxYR15mDO13FXF80mdePETrcy+dYpzGdAIzVKAAY25A2gNff8l8Gts8CsAAsAN4BHmv9mPRj3hGqAAAAAElFTkSuQmCC",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Wrap Screen (not implemented)\n`;
    }
  },
  {
    id: "ext_move_116",
    name: "Move to Contact",
    description: "Move to contact in direction @0",
    category: "move",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAr0lEQVR4nGNgYGD4T0v8nwE/BIH/Dx8+pDpuaGggzQEHDhygKh6eDrimrg7HA+aAL2Fh/68ICQ2sA25ycY86YNQB9HPAHRGR//dEReH4XUkJnA2SA2GahwDIkvf19WD8sbPz/+vkZDDGZTlNogDmiA8tLQQtp1kaAFlKjOU0cwDMEcSoo8gBDAZzyMajDhgeDqAGHloOACmmBSbaAQPaLCekgNZw1AGjDhh1wIA7AACllmgBGX7HTgAAAABJRU5ErkJggg==",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Move to Contact (not implemented)\n`;
    }
  },
  {
    id: "ext_move_115",
    name: "Bounce",
    description: "Bounce against @1",
    category: "move",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAA6klEQVR4nGNgYGD4T0v8nwE/BIH/Dx8+pDpuaGggzQEHDhygKh6eDji5efP/e6KiWDFVHcBgMAcFoxt+KScbbOl7oCUfWlro74CzzU0QB9TU/H+Tm0tfB8As/xIWRv8oQLf8XHnZ/0vZ2fRxADbLYepvKSrS1gH4LIflDpo6AJ/lNCkH0B3wJTKSJMtpGgKg6KC7A8421JPsCOrnAhIdQZtygARH0K4kRHPEucYG+joAxRHQ3HF6yWL6OgDZEVeXLqF+CBCLT82aSZs0QA1MkgNAimmBiXbAgDbLCSmgNRx1wKgDRh0w4A4AAFTrUZOq0pxyAAAAAElFTkSuQmCC",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Bounce (not implemented)\n`;
    }
  },
  {
    id: "ext_move_999_4",
    name: "-------------",
    description: "------------- action",
    category: "move",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAATUlEQVR4nO3WzQkAIAyD0Qzf2bpWRQfwBwwifA255fCOlaRytjSPxshwEXEGyMyrBQAAAAAAAAAAAPAXoI8d3QY8fctXA3cAAADwHNAA1Q8YAMbbG0AAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: ------------- (not implemented)\n`;
    }
  },
  {
    id: "ext_move_999_5_3",
    name: "Paths",
    description: "Paths action",
    category: "move",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAATUlEQVR4nO3WzQkAIAyD0Qzf2bpWRQfwBwwifA255fCOlaRytjSPxshwEXEGyMyrBQAAAAAAAAAAAPAXoI8d3QY8fctXA3cAAADwHNAA1Q8YAMbbG0AAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Paths (not implemented)\n`;
    }
  },
  {
    id: "ext_move_119",
    name: "Path",
    description: "Path action",
    category: "move",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAqUlEQVR4nO3WwQ2AIAwF0J5czoMDeHAVRmMVdvBew4GkaRDF8EswSP6B0MSnWCIRESPDVB7x4hBC8zjn6gDe+6YZF0DLyevGYwBiXayXgQByN9Dr+8EYQJqnaERah70BOdcAjTIByKfNgaAAiUiBd8HXtvwf4K7fTQ4ive+5djQ9CU0AJQQUkDv9TLdAIkqBfYStMgFVgFiMyGtA19/ypwL0mIAJmIDugAuRYYJHIg/12wAAAABJRU5ErkJggg==",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Path (not implemented)\n`;
    }
  },
  {
    id: "ext_move_124",
    name: "Path_End",
    description: "Path_End action",
    category: "move",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABJUlEQVR4nO2WXwqCQBDGFyq7T39O0UMH6KGreDQPUoYEgUT4YiAUTPOFE9NiWri6BCofOMus89txnVljjKEuRab+xkVJkjhXGIa/AURR5FT/C2CCnFZr8gtwW46eagoCUPhrOQUQiKoAWhjfbMkdAFamIWCLbAjt7xQAzwJwLzNhA2hQmet8EyJ4tphQsRi/ZQG6W3tFz3MGADvn4IA4zycvCIwVNRvVKQDs/WxKF4ZIGSLj4FdWL3VA28d5QEcGQTZ6K0Q6AycGgFLWju3eKmHMwSBACIyMdQqAb36oCCZ/Qh1EawBZcVUQXQ8+QbTqhnp1cZl2W7roVEG0bsfyUrvZfOoJNoSX84CG+N8DiRcAOHehrwG8HsubHLq+B4ABYADwDvAAS/xUQaxdYOkAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Path_End (not implemented)\n`;
    }
  },
  {
    id: "ext_move_122",
    name: "Path_Position",
    description: "Path_Position action",
    category: "move",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAvklEQVR4nO3WPQ6AIAwF4E5ezsEDODh7C47GVbiDe7VDTUOKf+FpTJC8gdDIJwqRiIiRYTpucnFKqXpCCPcAMcaq+S+AuoX7gf8BkDqpt4EAvAny8XFiDED7mhyh47AVsP0ckKNeAdin9UBQgEVo4Lvg6bZ8FbBs94ADSvtdJocCvPeuIJmY53lH2EBPQhnXyb1UARwhoCvgnX6lVwD5Brzz3wtsF9RKA9wCSDEilwGf/pafFaBbAzRAA3wOWAGtTGYlD7aOQgAAAABJRU5ErkJggg==",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Path_Position (not implemented)\n`;
    }
  },
  {
    id: "ext_move_123",
    name: "Path_Speed",
    description: "Path_Speed action",
    category: "move",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABJklEQVR4nO3WPw6CMBQG8LK4eADi7MjA6AEMkwNxJsTZAzC4sXgvrsIdjOunD9JSyx9tfE9DguSLQGv6a6UvKKUUJAM1fdAHdV2zpyxLP0BVVayZL0CtbjikmAeA+lF/OyKAoQHc9uwEGYC+1nERul1sBexrF+CifgKwZ3ujYuOARAE2gkIAiugumNoVNPh9BCEGsGdN3ygKYL3uIVgBelA6R5aZwWj2uFzahOEL4muAPVPs98053UeaGoxZAQJcr0AUmd+wALDZtIDdrsO4gPO5RRCAst0293lXII7HAXneIThWYKj6aUzzFySJATTPwPHYIriegaH6b6e3C54gBAHfLvCJSB3wBbBXQl/AWJsXgDpL5GPAX1/L33WQPhbAAlgAfwc8AMxvQJ/0T9tcAAAAAElFTkSuQmCC",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Path_Speed (not implemented)\n`;
    }
  },
  {
    id: "ext_move_999_6",
    name: "-------------",
    description: "------------- action",
    category: "move",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAATUlEQVR4nO3WzQkAIAyD0Qzf2bpWRQfwBwwifA255fCOlaRytjSPxshwEXEGyMyrBQAAAAAAAAAAAPAXoI8d3QY8fctXA3cAAADwHNAA1Q8YAMbbG0AAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: ------------- (not implemented)\n`;
    }
  },
  {
    id: "ext_move_999_7_4",
    name: "Steps",
    description: "Steps action",
    category: "move",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAATUlEQVR4nO3WzQkAIAyD0Qzf2bpWRQfwBwwifA255fCOlaRytjSPxshwEXEGyMyrBQAAAAAAAAAAAPAXoI8d3QY8fctXA3cAAADwHNAA1Q8YAMbbG0AAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Steps (not implemented)\n`;
    }
  },
  {
    id: "ext_move_120",
    name: "Step_Linear",
    description: "Step_Linear action",
    category: "move",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAy0lEQVR4nGNgYGD4T0v8nwE/BIH/Dx8+pDpuaGggzQEHDhygKh5ZDmAwmAPGA+IAmOXojhg5DqBLFJzcvPn/PVFRrJiuifBSTjbY0vdAwz+0tNDfASAMdkBNzf83ubn0dcDZ5iawhWcb6gcmCkCWfQkLg1t6KTubziEA9fm58jK42C1FRdo6ADnYceUOmjoAPdhJwdQJAWiw4woBmjiAULDT3AGUBDt1QoCCYKdpNhzeDgAppgUm2gED2iwnpIDWcNQBow4YdcCAOwAAisqvEwSzWPsAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Step_Linear (not implemented)\n`;
    }
  },
  {
    id: "ext_move_121",
    name: "Step_Potential",
    description: "Step_Potential action",
    category: "move",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAA10lEQVR4nO2WwQ2DMAxFfWMCDmzRaVinUVmjw2QBVqiUHbinMlKk1jIlFrbTQ4j+AYTiF/vbCgBAtlSG3wufnFJSVwhBBhBjVJUJwGsc2wKs4c5CwO25SxVgXR57MAz6GXyb5y+IEpxCXAagwcp7UfmuBnB04rMMqJXgaPMaD6iYkJ74L7vAdA5QD6CGYRJL1QO4IW5Uq0sAnAdcAbg6ugNQH7h6gJt+rl3ATj+mM1znAM2IBEgFgGZEUiLT+4BbBtxMKOl1iaoBml7Lz36wXh2gA3SA5gBv7ihBNycBmkUAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Step_Potential (not implemented)\n`;
    }
  },
  {
    id: "ext_main1_999_1",
    name: "Objects",
    description: "Objects action",
    category: "main1",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAATUlEQVR4nO3WzQkAIAyD0Qzf2bpWRQfwBwwifA255fCOlaRytjSPxshwEXEGyMyrBQAAAAAAAAAAAPAXoI8d3QY8fctXA3cAAADwHNAA1Q8YAMbbG0AAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Objects (not implemented)\n`;
    }
  },
  {
    id: "ext_main1_201",
    name: "Create Instance",
    description: "Create instance of object @0",
    category: "main1",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACiElEQVR4nO2WX0hTYRjGd9NN0F03BUEUZFdGd91Kt93UXUQsgjJhRa6l6xS1zbXaCpw2sjwja3M1Fs7NJTvb3P/chgS2yrRCbahYlFFZlAnnyfesA2phjc6ZNzuH52Lwsef3fO/7vd9RKBQKyCkoVn7pQaFQkFw6na40gEQiIakkBRgatGN8SI+pkcN4nd+PJ/1q5FIsUumUvAADA1FMF1ox/1kP/gsD/tMe8DMbMTe+FpO5Kjzk1OiLhuQDmC5cA757gB8R4Fs7+FkV+A/V4N+twdcX6zCZ3oxglwbhSFh6gOf5DszPNhXN6Zl7sASAdmHm0Xo87d0Jd2cLorGotABTLxuFbafkZL58B0SAV9w2dNyoR7evWzqAXC6O96P7ijUnU1Efdws9sBhglNsCN6uEs9MpIUA2hrfPaopmlFjUL3OxB970b1gA2ApHmxIsyy4pw38BZLIZjGQOCilFw8US00/EN+GxtxrNFhVYO4tYPCYdQCbZjolslZCUDEXRbzKn9MM925G4VwO9XgvXXReSqaR0TUh/lg6qhaNGhqLImJKTedazC5aLdTCbzQgEAtLPARoydM7pqFGtqeFIee8OITmZGwwGIX0iKdMopiFz230HxjMH0Nx6CpevHgfTcAQMUw/TJZNgvnwGSH4X2J0eGK/bER0eg9Hbi7rTDAxNBnjue35LLhOAC8ZbLnQNjuHsAsixkw1C3YNcsDy34U2HA4c053HCdAV7j9ZCWauC2WIGF+LKAxAKh2CxtYE5dwGaRi20Wi1sNhsifZHyAJB8fh+sVqvQeNYWK/w9/hXXy/JFRCeC6v6n67csAKWoJABaLIf+GWBVP8v/tkDutwJQAagArDrATwiutCUxjH/oAAAAAElFTkSuQmCC",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Create Instance (not implemented)\n`;
    }
  },
  {
    id: "ext_main1_206",
    name: "Create Moving",
    description: "Create moving instance of @0",
    category: "main1",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACgElEQVR4nO2WX0hTURzH50MvSW+BrKdokIGQ9OSzDN8CsbeQIfQmSOBKwhE0FRdbD00bGF5BSC0JxE2K/bHN/cltSCBWphXLRopFGpXrjwr3q79zPPsTWonn4svu5cs9995z7/fz+53fOffqdDodtBR0f99pQzqdli6r1bo/gHA4LFVSAWan+7Aw24al+Ut4P3MRzyfNSEYVRGNRbQGmpoJYTndj83sb1IwF6rfzUFdPYH3hKBaT5XjqM+NJ0K8dwHL6DvD7IbAxDvzqhbrWBPXLWaifj+DH62NYjJ2Ed+QqAuMB+QCvZvqxudbBzWlbf1QAQFlYfXYcLx6fw/BgF4KhoFyApTfXWNopcjL/MwMC4K3vNPrvNmPUPSoPIJmcwErqAh9zMhX6amQ1kA+Q8p3CsNKAgcEBiQCJED69rOZmFLHQjrmogcz2symfAfd6GqAoSsEwHAggnohjPm5iUQrDfInoCYB029EEpU9BaCIkDyAe6cWHRDmLlAyF6JzMP07qmfnPHYih+0OIRCPyipBeFvOa2VQjQyER9dzYGXZESwtQWsra0tcBWmRongtTKjjU13OzB9UserS2cpWVFUAcGECY0iIDo5GPdfcVoLaWtS2W5lwGCKCzE6ioyEJIAYBez9qoqmLnwbl3WYD2jnbep7GRQxAAyWBg16VlgAFUVrL2yHQOwG63cwCTKQchMwO7wVy23QJqajiAw85roK6OQ8iugXz5A344XD2wXL+RhXG5XDwD20AoKdFmFuTL7XHD6XTCdtMGZ5cTnjFPwTqg6Q+JEM0Ir8+b/fxm9jDXDGC32tjr3r4AqLMW+m+AQ/0t/1cHrfciQBGgCHDoAFv2Onu5TyXNAgAAAABJRU5ErkJggg==",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Create Moving (not implemented)\n`;
    }
  },
  {
    id: "ext_main1_207",
    name: "Create Random",
    description: "Create instance of random object",
    category: "main1",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACs0lEQVR4nO2WS0wTURSGu1JWgEQTSUjYujG6NyYmGnWhibpwb1hgSEzRVIkEYgWVII9U26Kh9UFfMzFTHoEO0JbODE1RiqKgRGp8pDwsikBLwUWF/s6dJo0G4iPMlA1z8yeTmZs537nnP/eOSqVSQUlB9edBLoTDYdml1Wr/D4DneVm1YYAXgxRGgo0YEKyZB5gOW7G6bEBy4RCW3uVioFcNn8+XGYDhoB2r3w1AgkcyehI/prdjQigE88SUGYDQqxtS5iR4cq4QicksTPIFsJivgeM45QGCgceIi8tOMifB51/mYbRjLwz6WnB8CqC/n8OHcROiUyX4On4Az4VKEc4nDwARqTlZdpI5CX6voQg0Tafffww9EEv0FMnlWiS/5WNhJA+e9orfVmhDAMRwd5p0aKLNKCvXwO6wpz9Oso9HilLB4xdEgJ2Ij+WAo4+iy9UlXxveMjbjqsGEK+WV8Hg96ed+v4D50H4pcxJ8ZWYbZoO70N1yDIyTkQ+AaWvH9apq6PV6+H6pryAIGOIrpWUnmZPgb7v2wNhQApZl5QMg8nq96/Y/MVxvhxadD4+AaT6Ou3XnYbFa5N0J010x6ELkUz2ik2cxNXoYz/i6tOPNLAfNbR1MprV7hCwAAX8PluaI4wNILhaL9d6BmaECMfubkik1VTUoVpfCZrMpAzA2bMRKTJ1yfOwMVr5kS/uC23EaLpcLrW2taLG0SKVSBGB0sB6Jz/kpx89mIzGRhUggHx2PTsHZ6lTuMEq3XH8P3gcOYvFNDmKvczEzsBvDbftgaLwEtptVHoDI43aCpc6hU+xzyngCurqLcDgcyp0F6+m+lYbZ7YemugY2+1rDKQ7QbLFBXaFF6eUyMAyTeYC+vj5QFAWKpqR72QHIZCX0zwCb+lv+twlKjy2ALYAtgE0H+AmH7sCL/6R/VAAAAABJRU5ErkJggg==",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Create Random (not implemented)\n`;
    }
  },
  {
    id: "ext_main1_202",
    name: "Change Instance",
    description: "Change instance into @0",
    category: "main1",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAB1UlEQVR4nO2Wy0oCURzGz0aEpKjEpUVSdCOIbFHPYI+gjyBEtejmONmVKBoQF5HYziRTuw6hlFIpRUEtlCBqIe1aVVDt+pozQy3KssvMhOA5fKtzON/vf4NDCCFQUiBfb7qQzWZlF8uyPwNIJBKyqvABAoET9PZcwMGkEVlNqQvgdFzAZr1DRwdgMDzDaExjaHjn7Zy0et8kO0A4fCyY32JhAbBYgMpK4Q2SQW2dH9HYwQejzyB+DcA6M+jslMxpBl4BtNp5uFx8TrNcEL8GsNvPoddLxpL5jaA4NJoJOJmo8gAroZRYcxq1pLggD8xtPuzsJj8Yv5csTUgbzmRaEtOu002j3bwIjot/Gn2uhvzzGG7x+3C7Y/B684+crCX4rs6W/cj2d+OUGUVydU1dgOvZETyMD+DRasVdTROOjI3YHmbVATiNBPEw1g+6nhyDuK+qxyEpw2JdC/ZjUeUBrkaH8GiziuY0A68AnLYCG65x5QHO7H24r24QjakuSTk2SSkYTRmCzJzyAMlQWKw5jZqKms+QEky2danXhLThfKZmMe0unR5T5i6scz51x3CP57Ht9oD3+nOeF/6HRFUAelkJfRvgX7/l+S4ovYsARYAiwL8DvACQN4JAcCi8zgAAAABJRU5ErkJggg==",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Change Instance (not implemented)\n`;
    }
  },
  {
    id: "ext_main1_203",
    name: "Destroy Instance",
    description: "Destroy the instance",
    category: "main1",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACo0lEQVR4nO2W204TQRiA+yg8Cm8AN1LBCy5IjMFEGklQkcpiDAchKZRwQQJJLVgwFqjpIdBu6ZGGM0EMFlRORRA8oCBCgfZzdw1IY6IQd8MNO/kuZnd255t//tkZnU6nQ0vQ/b3IF8vLy6ojCML5BILBoKpcCmgqEIoN0x5O0BT9QctomrahL/T29RIIBrQVcIfHMYuLCOI3HoX2qYskMcUOcSykKb9frkioItA/vUrPHCe0RpcxODe45d7itucr97w7GMVdGoeTBDZSLAAF1wro6OxQR2BiG+Wjp5k7hMjnI5wrSTyrB4xtp1g89Vyv12O1WrUTOGY+uYV7LUDk0xTZzmxWpXv+eFzdCPgTSUa2+IPo5iJZtix0rToFWWB2B7qjExQVFdHV3aWOgH0sgVOK72n80lBzB3IxjgsIEscCsXVoeOqm+GYxdrtdHYFnoVmsM2QwLnVUMSawtJ/GEDMoncv4EosYmy2UlpbS5+hTR8AZGKZ5JJVB/9v0SafyNExvLdDw0oRldpIbZZUYHxhxe9wq5cCgn7rgNg8De7ROJRHXj5j8jtK5HHp5Kj5IySjXh6RlWHL3DrV1tXh9XvV+RI89czilZJzZA9cSdLz6LSAjRyEsrQR5ZeTk5mBuNjMYGFRPQBydYP4IxPfgeCdl+utfAiu7KGxKz96koMpkorCwEGuHNeP9/xbwh0PE9/aVf0Lko7QK1iC8iVKPH8Azqc31khLy9HlUV1dnzL8qAiFJoLPLRrv9OS02G2ZphDJlVQJXrurJz8/HYDDQ2NSI44VDm91QTirLEws1tTVKllcYK6gUKqlvqKetvY2e3h5Ev6j9djzgHcDlduF0OZVQ+0TfxZ4HzsK5BOTGWnBmgQs9lv+rgdblUuBS4FLgwgV+AuH5z1kgeOKGAAAAAElFTkSuQmCC",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Destroy Instance (not implemented)\n`;
    }
  },
  {
    id: "ext_main1_204",
    name: "Destroy at Position",
    description: "Destroy instances at a position",
    category: "main1",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACQ0lEQVR4nO2Wy2sTURTGp6abgkK762uVTUvpY1OQoGKLttqFiaGgJZHJYDAJraaSihXq2NBFkGkFhUZBQmIbzEtirbHtKFIHuuiqm4K4zl/yee5lUiIUo/ROi5IZPubA3Mn3m3PuORNJkiRYKUi/P9mBcrksXNFo9O8ADMMQqv8bYOfbNoqKggQ9W1hahJ5KYvvD2vEBMPN9/uMSLskyNuiaO38OpU8l6wEyoSB+mOZeux2Jri4ev+jpQTwetxYgk83A73RyQ09rK1739fFYJUUaG5FVVesAcvkctvQtsMN+4yY0x1luPm2zIeRy8Vjr70fxfVE8QPp+GIt3p/B1dxdaMgljx8DkQhTXBgcRcTi4+SopePUK1j+uiwVgNd+jNTrpwsAACqfPwDUTwfKrZVy+F+bmadN87vEc9M+6OABm/r2piZv42tuR6u7msWI7BWU6jNjzZ7gzOgp5bAzqvIr027SYPVDp88puv97ZiRVKN4sjDQ1wut24FQxBW9Ig+2TEnsb4BhU2B974fAd9rlSZzzY3Y2poiMfjlPIgZYi9eTafFTsJE6b5ZEcHCr29PH7U0oJZE6S65tVpFwawtrqC8YkJ2P1+vKT7T6jHQ8PD3HyTdFjNhQJ82dw4KIGLevzhyAiPU6b5YTUX/jHSKN2BtjZc9Hq5ed5MO3vzWuZHBngQCMDr8eA2bcZ31Nd+mnC1ai4MwE19XaIS/PL1o/HKJlxlyFgKIEr/FgBbbIX+GOBE/5bXWmD1WQeoA9QBThzgJ0YMQwxG9ufUAAAAAElFTkSuQmCC",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Destroy at Position (not implemented)\n`;
    }
  },
  {
    id: "ext_main1_999_2",
    name: "--------------",
    description: "-------------- action",
    category: "main1",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAATUlEQVR4nO3WzQkAIAyD0Qzf2bpWRQfwBwwifA255fCOlaRytjSPxshwEXEGyMyrBQAAAAAAAAAAAPAXoI8d3QY8fctXA3cAAADwHNAA1Q8YAMbbG0AAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: -------------- (not implemented)\n`;
    }
  },
  {
    id: "ext_main1_999_3",
    name: "Sprite",
    description: "Sprite action",
    category: "main1",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAATUlEQVR4nO3WzQkAIAyD0Qzf2bpWRQfwBwwifA255fCOlaRytjSPxshwEXEGyMyrBQAAAAAAAAAAAPAXoI8d3QY8fctXA3cAAADwHNAA1Q8YAMbbG0AAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Sprite (not implemented)\n`;
    }
  },
  {
    id: "ext_main1_541",
    name: "Change Sprite",
    description: "Change sprite into @0",
    category: "main1",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAw0lEQVR4nO2WwQ2EIBBFpxYroTS62BMF2AVteOS6TcxmiGQNAmKYCUqAvIOG+N+ggAAAKAlCuVND5xw7Wut7AtZaVqYAq4AxBpVSJ+i+qMAxePMP+0PXJZFmgRAeB+O6om+RSCzRLJAMJ3x2ejaOEk0CofpTeIJt57MsfALZ6hOhAdZXkKs+DqWQ3EoQEbgKHWsGun4Dd1fBl3sV1MyC6D5Q3Akrwsc4Cx5xGrbwLgEaLEG1QNff8qsB0n0KTIEp0F3gB/KnE+6OU99gAAAAAElFTkSuQmCC",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Change Sprite (not implemented)\n`;
    }
  },
  {
    id: "ext_main1_542",
    name: "Transform_Sprite",
    description: "Transform_Sprite action",
    category: "main1",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAA80lEQVR4nO2WwQ3DIAxFPUsmYTS26IkBsgVr5MgktEa14jrQEMUuPQD6UgQJ/xkIBgAgWyrD94olp5TU5b2/BhBjVNXPAXCcYQDF6FU4hCpACCE75w7CdjKnQhAqANx4K4Pt2uRuf5uTbgOQuTTO60qhfoCoL0HVnBnxNnUAiv5gXpHJDDSjZ6aox7IUmQC0jMkUhSb8TzAH4Kam58BfzIDc6XLXm54DeyptAwB7Vj0Ja9FU8zw7D9SWQEbTU/AbWjKVbHh1Bigpqd4HyKSVDam/ZqyWC+SU9vYNuZDcBsCXLdQNYKlTgLMXrOsEmAATYDjAE3UO2V1rJmadAAAAAElFTkSuQmCC",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Transform_Sprite (not implemented)\n`;
    }
  },
  {
    id: "ext_main1_543",
    name: "Color_Sprite",
    description: "Color_Sprite action",
    category: "main1",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAA7UlEQVR4nO2WsQ3DIBBFySreIh3KAJmJEdKlQukzQirWoKTNEpecFSxyBmOLOzmRMHqFLdB/nI1BKaVAElDLDS8IIbBjjNkm4JxjpQuwClhrQWs9A5+LCqTB6vSAw9lP4P2SSLNADKfBl7sH7+ciVKJZIBeOYDiOyVUjlWgSiLOn4TkwfOR44xMozT4XGmF9BaXZ01AMKa0EGYFKKKsAjIO/8W+uwzAhWgGfEUhFqAzrNxBXQUmAyjw/MmyrYE0VqATrfyCtQk0iFy6yF1CRGCy2F/zEbtjCfwlgZwlWC+x6LK91kG5doAt0gd0FXq4HGsALkKvLAAAAAElFTkSuQmCC",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Color_Sprite (not implemented)\n`;
    }
  },
  {
    id: "ext_main1_205",
    name: "Set_Sprite_Old",
    description: "Set_Sprite_Old action",
    category: "main1",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAA5klEQVR4nGNgYGD4T0v8nwE/BIH/v9N8qY4bGhpGHUB9B9zVZfj/zxg3HnXA8HDAhwO4HUQ3B7y/FoMi5rD+/3/u7o/0c8DfMwz/f15QBvOlF/77zzDzH/0dAMOOa7aiOAAfpokDQNjl2OT/jNP+gB2BDTfNOUO9ggibA0BikpvOgEMCGwY5gmYOAFu+7AZOy2nmABANwoLzXuO1nCYOAOHNe8MIWozLcqoURJkLHoENJ2Q51R2AjmGWkGI51esCZAuRHYRPz/BskNDMASDFtMBEO2BAm+WEFNAajjpg1AGjDhhwBwAAdDK5nWYfY70AAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Set_Sprite_Old (not implemented)\n`;
    }
  },
  {
    id: "ext_main1_999_4",
    name: "-----------",
    description: "----------- action",
    category: "main1",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAATUlEQVR4nO3WzQkAIAyD0Qzf2bpWRQfwBwwifA255fCOlaRytjSPxshwEXEGyMyrBQAAAAAAAAAAAPAXoI8d3QY8fctXA3cAAADwHNAA1Q8YAMbbG0AAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: ----------- (not implemented)\n`;
    }
  },
  {
    id: "ext_main1_999_5",
    name: "Sounds",
    description: "Sounds action",
    category: "main1",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAATUlEQVR4nO3WzQkAIAyD0Qzf2bpWRQfwBwwifA255fCOlaRytjSPxshwEXEGyMyrBQAAAAAAAAAAAPAXoI8d3QY8fctXA3cAAADwHNAA1Q8YAMbbG0AAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Sounds (not implemented)\n`;
    }
  },
  {
    id: "ext_main1_211",
    name: "Play Sound",
    description: "Play sound @0",
    category: "main1",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACGklEQVR4nO2WPWvCUBiF85ccXR0DdQhOQdQ0bkGXgEswKgjtkDFjwEEUEbK0hNoWNVNGx+xO/QmObz2vvZKCH/24touGgxfuJed5z/2KoigKXVKknH7wo/V6LV3dbvd7AHEcS5V0gNnzjB4eH2gymbDQ/hMAGIdhSLZtUz6fp0KhQKqqUrFYpGazeRRECoAwL5VKn8w1TSNd11kAwRipAGEYURRFNJ1O98ZZc9M0WZZlkeM4VKlUGFYKgGl6lKYprVYrMm4NyuVybJ5NQJhjWgCAJAaDwe8BbNunJElps9kwgDBFGpDneWyKFGDs+z71+33uq9VqvwfQNLwspbe3Db9cRA+Y+Xy+B0AKaAdBwEIfEslOw48AVNXZVhRtzZN99agQi2w0GnHVMNI0kwFQOfoAKAUAsiyfpwIAqFRELaoXAABKkoQhpAJANzfmfsHp+m7BWZbNYI6zSwLmkADBWGkAd/deZr9bH8bBViFLmGLuxfQYhiEPAKpWqxw5pOuY+4DTwKJD5BDMAQLQ4XAo9yRsu202xyKEEDsqhqHYFaJdLpflH8Xj8Zh6vR6bI2JhKGJHG/84hA7dB1LuglarxeaIHTsBbWEOHTOXBrCMl9TpdNg8mwCOYlxQp65kadcxIFzXpUajwQuzXq8fvP0u+kGyWC7oafbEenl9OWsuHeAn+hYABl9CXwb418/ycwMu/VwBrgBXgH8HeAdnmmICGulK6AAAAABJRU5ErkJggg==",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Play Sound (not implemented)\n`;
    }
  },
  {
    id: "ext_main1_212",
    name: "Stop Sound",
    description: "Stop sound @0",
    category: "main1",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAADKElEQVR4nO2W3UtTYRzHR6kkVIRKNwaRIL7Ol5y4YQVbNWFui5YELnTILKvpKFcXuTKDmYG7aLKoLDGcbpM5ZdrZluLmhVvZizfVRhcRXvkHeNHltz0/UZToxTzmjefwhXPxcL6f5/f2PAKBQICtFAS/f9mDhYUF3tXR0bExgJmZGV7FO0DwVRDjE+Nwu90k9v1fAJix1+uFyWSCRCKBTCaDQqGAWq2G0Wj8JcimAL7uPYrYERm8LwYwMjKCmpqadeYajQZarZbEQBggrwDxDAm+CfLAZYpRUlJCxmvN9Xo9yWAwwGw2o76+niLFC4Beb8Vcvwtv0kUEcWdfFiorK9dFYMV8WKKmNfoqJfr6+jYPYDLZEY3GsLS0BMejJ5hMziGDXvl5OJ1OWK1WqoULqjOIHj6BL3uKcVciR0NDA0UmFAptDkCjsYDjYlhc/A6bzQZpWTmmUnIJ4rHuCiwWC7rqLuJ9qhDvDopxTa6CUqlEZ2cnmpqa1qXhnwAUCnPChIPdHqWQS6VS3Lh0GZEDiaJMLsDzQiniKUJ4M0Q4e1JOuWdQs7OzlJJNAzAZDHZKBQNg+W5ra0NH603EkgooEp60ImRnC8l8aGgIPp8P8/Pz/AEwqVT61YLTavWYyJWR+afd+fi4Kw+1xRUYHh5GJBIhiGg0Smt5A+h6YF1tOW/Wsrkz8xhEORKEUovwOSkfjlv34Pf7aQYwCFaIvAEw6XQ6+AtOk3l/Rjny849DJJLgtvE65tLLqRbsV1sRDocJ1OFw8DuKX1Ys9/js/mKUlpaiqqoKLpeLCs7bP4DXaWWIJxfC3X4ftbW1/E7CtxYbmccTlX8qV0g7HBwcpFxPT0/D4/HA9fQZuENiWuetrku0L8cfwIe6Vvrxw/Q8akU2bnt6eijXLOcMhEWiuroavWJFokUL0d7ejmCQpxoIBAI0XDTnNImOUKG7u5t2vhIBNorZAeUb99Fhxcybm5sxNjbGXw0wiNHRUXB+jgxaWlqoMBsbG386/djO15rzfiEJhUMIBAOkyanJ7bkRbVQbAmCLt0J/DbCt1/I/LdjqdwdgB2AHYNsBfgDYgyDdqbYBhQAAAABJRU5ErkJggg==",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Stop Sound (not implemented)\n`;
    }
  },
  {
    id: "ext_main1_213",
    name: "Check Sound",
    description: "If sound @0 is @Nplaying",
    category: "main1",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACHUlEQVR4nO2WsWvCQBjF+y85ujoGdAhOQdQ0bkGXgBSCEalj2ilDh6wWBINQG0pLLaVDhg6O2Tt16B/g+DXvsydpa6iaoy4aHjk4uff73t3l7oRONj/Jj3ZR1jh/PZnmb2+0tc46T3tDZJrf3n7spH0hpJjngdja3LbPqVgsUqlUIkVRqFKpUKfTyQ3xp/l0+kjVavWbuaqqpGkaCyB5IDaaT6cvFIYvNJk8rI3T5oZhsEzTTJKxqV6v7w3xC8AwXIrjmBaLBemnOhUKBTZPJyDMLctiACRxfX2fH8CyPIqimJbLJQMI0zAMWa7rsilSgLHneTQcDrmv2WzmB1BVDBbT+/uSBxfRA2Y+n68BkALavu+z0IdEcgMoip1UFCbm0bp6VBgEAY1GI64aRqpqMAAqRx8ApQBApunxVAAAlYqoRfUCAEBRFDGEVACoXDbWC07TVgvONC0Gs+1VEjCHBAj+Kw3g4vIqtd/NL2M/UcASpph7MT26rssDgBqNBkcOaRrm3uc0sOgQOQRzgAB0PH6UC9BzemyORQghdlQMQ7ErRLtWq8n7EAmNx3c0GAzYHBELQxE72njjIzSbvcoHgLrdLpsjduwEtIU5BPOb2XOuk1FQZEL0+302TyeATzEOqE2V73wYpaLIhHAch9rtNi/MVqvFJ6SsO8HP+TjchSQvhJQrWRoCA+4iaZfSNMTBruX/+RwBjgBHgIMDfAL6b0q2bcTIbgAAAABJRU5ErkJggg==",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Check Sound (not implemented)\n`;
    }
  },
  {
    id: "ext_main1_999_6",
    name: "----------",
    description: "---------- action",
    category: "main1",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAATUlEQVR4nO3WzQkAIAyD0Qzf2bpWRQfwBwwifA255fCOlaRytjSPxshwEXEGyMyrBQAAAAAAAAAAAPAXoI8d3QY8fctXA3cAAADwHNAA1Q8YAMbbG0AAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: ---------- (not implemented)\n`;
    }
  },
  {
    id: "ext_main1_999_7",
    name: "Rooms",
    description: "Rooms action",
    category: "main1",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAATUlEQVR4nO3WzQkAIAyD0Qzf2bpWRQfwBwwifA255fCOlaRytjSPxshwEXEGyMyrBQAAAAAAAAAAAPAXoI8d3QY8fctXA3cAAADwHNAA1Q8YAMbbG0AAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Rooms (not implemented)\n`;
    }
  },
  {
    id: "ext_main1_221",
    name: "Previous Room",
    description: "Go to previous room",
    category: "main1",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAA80lEQVR4nGNgYGD4T0v8nwE/BIH/Dx8+pDpuaGggzQEHDhygKh51wNB3AEPyOZLw8HQALvAdip8DiWvv/9PWASpF5ngtP/achg4AWY7sAGTLae4AkMUyS/jhDviO5AiY5SC89hoNHAC2fAX/f7Mt0vBQgGGYxSCfb71HAwcgWx5wUON/8U2H/80vA/5P/pnwnyGNAW45yGIYpqoDQJZYr5IFW556xhjDAeiW0yQKQBbZL1X6X3jdDsxGwXQrB4CWuSzWBUfJgNUFIEcMqANgiXJAHUAuHnUASQ4AKaYFJtoBA9osJ6SA1nDUAaMOGHXAgDsAAM2ipQs3IN5TAAAAAElFTkSuQmCC",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Previous Room (not implemented)\n`;
    }
  },
  {
    id: "ext_main1_222",
    name: "Next Room",
    description: "Go to next room",
    category: "main1",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAA6ElEQVR4nGNgYGD4T0v8nwE/BIH/Dx8+pDpuaGggzQEHDhygKh51wNB3AEPyOZLw8HQALvAdip8DiWvv/9PXAciWqxSZ/z/2nI4OQLYc5gAQposDviPRsKAHWS6zhB9M09QB35EwzNcwbLZF+r/MCkxHUM0B6MHOkMbwf/LPhP/NLwP+F990+B9wUAOrI6jiAHTLwSkezQGpZ4zBjrBeJQuWo305ALQEGRdet/tvv1QJxXK6FcWgIHdZrIthOV0dgM1yujqAZpURpXjUASQ5AKSYFphoBwxos5yQAlrDUQeMOmDUAQPuAABTPKtyL9PR0AAAAABJRU5ErkJggg==",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Next Room (not implemented)\n`;
    }
  },
  {
    id: "ext_main1_223",
    name: "Restart Room",
    description: "Restart the current room",
    category: "main1",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAA6UlEQVR4nGNgYGD4T0v8nwE/BIH/Dx8+pDpuaGggzQEHDhygKh51wNB3AEPyOZLw8HQALvAdip8DiWvv/9PXAeiWH3tORwcgW053B4AsZkhj+K9SZA63HITXXqODA2CWW6+S/S+zgh/sCJDPt96jgwNgltsvVfofcFDjv9kWabgjQJbT1AEwy10W6/4vvG73P/WMMcIRSxCOoJkDQBbAMMghxTcdwBhZHCxHCwdgOAjogOaXAWAMspTudQHIAZN/JoDxgDkAhgfEAaTiUQeQ5ACQYlpgoh0woM1yQgpoDUcdMOqAUQcMuAMAWT2oNMqggFkAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Restart Room (not implemented)\n`;
    }
  },
  {
    id: "ext_main1_224",
    name: "Different Room",
    description: "Go to room @0",
    category: "main1",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAA9klEQVR4nGNgYGD4T0v8nwE/BIH/Dx8+pDpuaGggzQEHDhygKh51wNB3AEPyOZLw8HQALvAdip8DiWvv/9PXAeiWH3tORwcgW053B3xHomGWg/Daa3RwAMhShjQGOFYpMgf7fOs9OjjgO5IDJv9MAGOQA0AWwzDNHIAc5yAHNL8MAGO6OQBkEQyDHFB80wGMkcXBcrRwANwhQItdFuv+L7xu9z/1jPH/gIMa/822SP+XWcIPtpwudQHIEfZLlRCWr8BvOU0qI5AjrFfJEmU5TRwAcwQxltPMAaTgoeUAkGJaYKIdMKDNckIKaA1HHTDqgFEHDLgDAAXHrHPeY7sTAAAAAElFTkSuQmCC",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Different Room (not implemented)\n`;
    }
  },
  {
    id: "ext_main1_225",
    name: "Check Previous",
    description: "If previous room exists",
    category: "main1",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABIElEQVR4nGP4z4AdAsF/UjAucwhBnJY/fPifaFyRt49sR+C0fMuW1yRhch1BFcspcQTVLCfXEVS1nBxHUN1yUh2B0wEMyedIwsPTAbjAdyh+DiSuvf9PWweoFJnjtfzYcxo6AGQ5sgOQLae5A0AWyyzhhzvgO5IjYJaD8NprNHAA2PIV/P/NtkjDQwGGYRaDfL71Hg0cgGx5wEGN/8U3Hf43vwz4P/lnwn+GNAa45SCLYZiqDgBZYr1KFmx56hljDAegW06TKABZZL9U6X/hdTswGwXTrRwAWuayWBccJTQtiqGuwOkIchxAUmWEFBQ4syOtLEdxAD5H0MpyDAdQ4giqNMmQHQEykBRMtUYpsiMGrFlOTzjqgFEHjDpgwB0AAFqXjosU4XQWAAAAAElFTkSuQmCC",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Check Previous (not implemented)\n`;
    }
  },
  {
    id: "ext_main1_226",
    name: "Check Next",
    description: "If next room exists",
    category: "main1",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABGElEQVR4nGP4z4AdAsF/UjAucwhBnJY/fPifaFyRt49sR+C0fMuW1yRhch1BFcspcQTVLCfXEVS1nBxHUN1yUh2B0wEMyedIwsPTAbjAdyh+DiSuvf9PXwcgW65SZP7/2HM6OgDZcpgDQJguDviORMOCHmS5zBJ+ME1TB3xHwjBfw7DZFun/MiswHUE1B6AHO0Maw//JPxP+N78M+F980+F/wEENrI6gigPQLQeneDQHpJ4xBjvCepUsWI725QDQEmRceN3uv/1SJRTLqeIAYjAoyF0W62JYTpIDoK4gyxHgLEiB5XAHkOsISrIfhgMoCQlyLcdwACWOoEqTDNkRIANJwVRrlCI7YsCa5fSEow4YdcCoAwbcAQDNPpTysuSF2wAAAABJRU5ErkJggg==",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Check Next (not implemented)\n`;
    }
  },
  {
    id: "ext_main2_999_1",
    name: "Timing",
    description: "Timing action",
    category: "main2",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAATUlEQVR4nO3WzQkAIAyD0Qzf2bpWRQfwBwwifA255fCOlaRytjSPxshwEXEGyMyrBQAAAAAAAAAAAPAXoI8d3QY8fctXA3cAAADwHNAA1Q8YAMbbG0AAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Timing (not implemented)\n`;
    }
  },
  {
    id: "ext_main2_301",
    name: "Set Alarm",
    description: "Set @1 @rto @0",
    category: "main2",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAADyUlEQVR4nO2WyU9bVxSH+dO6SgQSpIuSBgW1UsmiVVKEkBClZc4gUhJswJg4KcZODHgMxmAexgYbYzyVAA44lBAINogwhEBLS1MofL28oi47gN1s8p5/ul5c6Xzn3fM752ZkZGSQTpHx9+/xQyKRSLmqq6v/G4DP50upzgwQDAXldWQsSiAcIRiOMjoWYdAzitvjTT+ALxDCH54gsfyKhYVFQqEQXq8Xt3sYu92BTq/D5XKlB8A+MsXSUoJkchlvIILZFcYghdH3+dFbHJgtVqxWK0qlks6uztQC9PknWVlZYSb+Az2j0zxbP2D3N4hdyeSnlwHGd8EYS6LSGzF0dFJTU0O7rj01AAO+EAsi8+cvXuKNzvLm533+erYW2N3bYeYQHs8l+ejyJzQ9NNPU3ERJSQkdnR1nA/AHo/jCMVZXV+kNxOXgR0cgfhxjvBZ6LtSfSPLhxTzKNT08iixy846CiopKKiorcA26Tg/gGRllfjFBdHyCmbUDOemjk8DJk+C98bgcvEYrIa1AdAdufWdAoVBz9eqXcmGeGsDlj8pnb3NH2NxY4/eDt/wqgiaEJra36XC75eA39G4a7N/Tv7zP9KtdbMIR9fWtXLtWzN2Gu6cHcAammZ+fl6v9uOAO1+OIBJkTckxN8XFeHufOn+eDc1nyWlBURsItyXtra5soKvpGLshTAzhGYszNzWHoHyW4B7MicPw4e3EO3u0dqtuMVD0cxjQPlgVxHIvi6/wCtidPaWzs4vMviqmsqjw9gOSL8DQ+i8FkZfD1AUFhvbG3EBDn4BPWc4li6FmGbnEmRgERXYdNUSrNJhtarYfL+Z9x/cb1s9nQ6fHjdDrRjz1jWHx/9xZIG+Bcg75VYb8lEVxUoyTWXRF8Zn2Tm0otGs0AOTk5siXPBDA47MUpubhvMGGcXGJo41AIBkTw3qkNpLk9xkXmPwpfvtjaobnTjskyyaVLBRRcKcBkNp29Ez6y9tGm1aJ4oOOBZ5zQ1j5P3vzZCddCfkRjJLa2iUJv4d79QaqqNGRlZVF3u04MKXdqZoGhQ6KhoYFvFY3UNmlQmHpoU9ZzT9vGLY2WO61GMQ9ilJeryMzMprS0FNtjWwqnoX8Mrd5MXd1t1Op2UeVaAdSOSmVBp/OK/2YuXLhIdnY2ZV+X4eh1pH4cDw0P0dXVJbxdK3r9V8LnpaLbFZOf/ym5ubkUFhaiUCrotnen6T5wImlAklusulWNqkVFi7pF2E6LvccuQ6bvQvJ/XsmON6dD/xrgnV7L/2lDut/3AO8B3gO8c4A/AEqXzbng4OP7AAAAAElFTkSuQmCC",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Set Alarm (not implemented)\n`;
    }
  },
  {
    id: "ext_main2_302",
    name: "Sleep",
    description: "Sleep @0 milliseconds",
    category: "main2",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAiUlEQVR4nO2WSwrAIAxE5+guejBX9hyeRLGr0uKvTAiUMQy4CM4zRhEAiqUKxtFGyTnTFULYA4gxUiUAAdABgOMltwrczdOZLtEA2mKj3T7nvYrQKtAzH+XRAL6a0wFWj4QKMOty0x5YMTd7B3bvu8s7IAAB/A+gJVtoGcD1Wz5LsA4BCEAA7gAVbf+mPDZhM/UAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Sleep (not implemented)\n`;
    }
  },
  {
    id: "ext_main2_303",
    name: "Set TimeLine (OLD)",
    description: "Set TimeLine (OLD) action",
    category: "main2",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABNUlEQVR4nO2WT0sCQRjG5/MpXfwQHTz0Bbrsx+gYFBGBEsFCnoqwg6RYoYQkhX8SRNtxTdd2F3vad2IPFawJvrMQM8NzGGbg+e3O+8yMEEKAUxDJnRrC7a2Ny7IsA/APADK5glI2f6UUj3+KDSA2XiXWLdjZLeLwRuLsfoLTuwmOqxIH0XivPFZz7DVAJl0nALXRNETzZYGHwQKXrTd9ANftGZ5GPp7HPi5aU5w3XRRvpR6AGKJQlyhFxrQN+xUn0ZwlhmR4UpM4qiZ/OSuA3XAVRGoAvagYH4fv+gHIcOgGcGahgmj0PX01QEYDGWD5AXjBEn359Rdqnbm+GFLu6QzovPqodz1lXo6iyQ6Q+lGcydlKvy8j+5u0pGBdGYC1AGgxh/4MkOqzfNUC7m4ADIABSB3gE8Sy/IMTz+2nAAAAAElFTkSuQmCC",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Set TimeLine (OLD) (not implemented)\n`;
    }
  },
  {
    id: "ext_main2_305",
    name: "Set TimeLine",
    description: "Set TimeLine action",
    category: "main2",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABOElEQVR4nO2WQUvDMBiG8/vmbT/Dg3/AS3+Gx4EiImyIUJgni8yDuDEnGzIUJXMOxmazztmtHfNdv0gPbtBZaNJLEp5DaOB92uRLwxhjUAlYcqcGznnmWJaVTsBxnEwxApkIFIplyd7+jSQeb6JMIA7ehdIlODis4ORe4PJxgovWBGd1geNofFQby2fK9wCF9NwQ1EbTJTofczwN5nC6X/oEbl9meB0FeBsHuO5OUe14qDwIPQKxRLkpcBUF0zKU7tzEcCVlSIHnDYHTevKbKxWw256UyE3gPdqMz8OFfgEKHHoh3NlSSrT7vr49QEEDEWL1A/jhCn3x+xUa/FtfGVLd0xnAPwM0e74Mr0WlqVwg96O4ULQl2z8j+w9aqiAtRiCVAE1Wwb8Fcr2W75qguhsBI2AEchdYA+M2zJ/kfZ4kAAAAAElFTkSuQmCC",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Set TimeLine (not implemented)\n`;
    }
  },
  {
    id: "ext_main2_304",
    name: "Position TimeLine",
    description: "Position TimeLine action",
    category: "main2",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABmElEQVR4nO2WwUoCQRyH5w16gOoSHbp0CuoQVIdOdZGeoEsdOgTVsYvQI3TpGGghghKRUKe2sEOkWKGIFMWaCaI5aqbtiv3amdhyNdJyRwl2h+8wuwu/b2fmP7OEEAKRgPzc2AVZlk3Hbrf/TkCSJFOxBP4sMDPn4cwunXL0fj3CBPTgZgidguV1L5wXFPvXOexd5eAKUDi0/pY/w58JXwMsJJ5Vwa50oYLIYxnRZBlS7LlzAme3RdylFdxnFBzHCjiM5OG9pJ0R0CU8IYojLZhNw/Z5tuVw08qQBbqDFLuB1r/cdAFfOM8l6gUGV8dAFsknwgQetMV4k3r9VmBTmecIEWCBqbyKbLHCJcKJkkGCCWykbBzTBVhQkqqovgEltYoE/RgFFlrLWmyKwwRq75siwOqe7QHyk4JQvISg/AK/VposoM/Zg9GDXthOhrAQGMFKdALTjmHDSAjdirmE60ticmegYRraOIx8nMbDyGdAlxh394urgmbopShsH2iH/yXAXhZBywJd/S1v9oLoZglYApZA1wXeAZmilmgd2tHNAAAAAElFTkSuQmCC",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Position TimeLine (not implemented)\n`;
    }
  },
  {
    id: "ext_main2_309",
    name: "Speed TimeLine",
    description: "Speed TimeLine action",
    category: "main2",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABj0lEQVR4nO2WT0sCQRjG98N52hDBi9/BQ1+giwe/gx2DIiTQIhDq1CJ2iBIrlJCiWDNBNEfNNFfsad9ZdtPV8s84etkdHth5GHh+zLzv7CqKokCmoPw/6IGu6ytXJBJZDEDTtJVKGsCxuX4eTyqAO3CatzSAGkxwbYXTXPbcFgVBVccCp3lLA9jBf4mHxeOA3+8ETvOEjmB7J4mDa4bT+yZO7pqI3zDsm/PdTN0Ki8WAaBQIhZztd3vCAKWGAXpq7QEKbz08VHrQih9WGAWFw0Ag8Avg8oQBLp86eK718VLv46LYxlmhheQts8JGgpwjcHnCXUAQiRzDuRlMx7B31eAeD/P5JovQ5a2kDSnwKMtwaNYAva+lDd0AqXyLQ4wCrO0iotBXsxgfq18OwNquYgqstgw0OgMOkS93F4IQ7oIKMzD8BrrGEGVm7UJW/5wbQhiA+p7uAP29j1ypy8MzZmtKB5h1FduSBqAGU1yTH6PUmKQXoag8gIUAaLEMzQ2w0d/yWQtkDw/AA/AANg7wAz5wj0qf2wyEAAAAAElFTkSuQmCC",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Speed TimeLine (not implemented)\n`;
    }
  },
  {
    id: "ext_main2_306",
    name: "Start TimeLine",
    description: "Start TimeLine action",
    category: "main2",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACG0lEQVR4nO2WS0gbQRjHF5MoohgEjagFaVF8URAKStGTeKm9BXopWuuDHAQVj6KFHETFixcLHlsq4gNFhEDFQ4PYgzSiFYMERdn4AFGzJtrEROzffCMbjIEYYYZcssP/sLsDv988vtmVJEmCyECK3uiCLMvcYzabnydgtVpjjmSSkNtYGLWPcIGXg9nQNafGT6DP+Q61k0VI6dDyFag3zrK8b19mUe8fpmqgCiNOE7rsNfiwVI7UJj0/ARUcLdXD1Qw+7GiByfYGJaNZ0LTq+C1BZ+8cxv8oWNi8wPzfC0zaFPwI3o+tnLF3JEDwwe0mfF6tQN3SK5R8z0ZGo4GfgNMVAF2nnhvYj3zYPvbB6rhk72gP0MgJblwuRaXlBV7P5yD5iwbatmQ+Ar93r7B36sf+mR+/HB78tLsxt6GEBFQ4jZ7gBVN6aLqTkNacyacKCDS7rmAxCKZl+LbqYs/UKlDhNHqCpw3pkP+xmG8ZEnB6TcGETQnBVQEVzqa+RxNxJnATsGy5mcRjARWe8zUdmQ15Yg4igh4EN+POyXWEQPmMAfr+lIjy4yZAwBN3AK6rGyaxdegN2wParqSwsuMqQKBjJYDb/4A3cItD5X4W1uR/oSoo+/RW3MeIIFT3dAbI536sO70MvhIszYdLIUQglqOYIkyg3mhhifwYWcIiTIBXEgLPEqDOIhKzQFx/y5/qILolBBICCYG4C9wB2p5tMObxkn4AAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Start TimeLine (not implemented)\n`;
    }
  },
  {
    id: "ext_main2_307",
    name: "Pause TimeLine",
    description: "Pause TimeLine action",
    category: "main2",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACLElEQVR4nO2WTUgbQRiGF6kg9FD0pAcrKvXQRmsRIYIoWoqixWr0UDxYpD2Iip5KUSnk0qOCN48tLSIFRYSUWqpZxR6Kij9EWjEkTkxi1DRrrMYmom93RlcQd/3bXXLJDC/svHzL9+zMfLPDcRwHPQXu4k4bCCGay2w2Xw+A53lNpRuAv+cNXHWP8LssE98KUhQ93QA237VA+NANe20uvhfdVfRuDFBhGmSqbJ5kksaSfB0N8Pd2YsX0EGOlmewdOe/GAFJiJa2314pf3Ap7TTbGT5LJeaqWoK1rCJ+mBYwsbmN4YRsDMwI+iuO+KT+8rc/ge/sS9ur7sJaks3g5TzWAKxABbVs7B1jy7OOXdx/88l94Xj2B73U9HFX3YC1OZfFynmqAH/ZdOLbCcPrDsC7v4OtSEEPzAtwvitmUO5+mgS9MZvFynuoqoBCDcwJGxcR0Gd7/DBzPzPN8eJoqsVqejEljEouV8zQpQ5rw86yAfnEP0GfqkRoD3I2lII/vYCLvtqKnGYDFFmQQEoCzPANr9UaQogRM5MQrepoBrImbcWXj3ymAoyQFpNqA1YJbGH8Qp+hpsgc2ghEEdg8YhM0dYp7NmAjeEIcvWRwsomisnKe6CrxCBIdHQChyCLdwPAuzZO90JnT9GdEktO7pGUD+hDHnCrHkU2Jp6g5w2VEsSTeACpOF6fzPyHJGUbsPXFUxgGsB0GA9dGWAqF7LLwvQu8cAYgAxgKgD/Ad2RHwkLy3pCgAAAABJRU5ErkJggg==",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Pause TimeLine (not implemented)\n`;
    }
  },
  {
    id: "ext_main2_308",
    name: "Stop TimeLine",
    description: "Stop TimeLine action",
    category: "main2",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACnklEQVR4nO2WXUhTYRjHhzcF3dSlF31gUd6VF1EhGdRK1AhcZBZSUATLYmFFSVG6BEOCDKxuRLEPIqJFHyzSok3TmnPbYeUwy8rjPtzczs62ds7OJvbvvCeMojDHzsmbvS8/eN/DgefH+z7Pc45KpVJBSaCaeZIBmqZlp76+Pj0Bs9ksK4oJMC3nENBr4T+zH+MnK+Gr2QXv0R3wHNqG0d1rlRUIXasD09qIUHMtYl0GCCMuCB/eIfroBnzHNKD3rsdA8crMBEo1Bomy6h6J6T0hcEGL0JVa8I5ecH3PMXGxBoGGI4h3G8G97gJdVQhbSX5mAtOB/8b46Sp87boPzvIS48f3INx2Ccx1PTz7CsF1PwHT3gR7SYYnQNCdfYDbAywev43goTOCuzYWt8S9T1cuHXmo5Ty8h7dDeO+EMGiFuzwfQf0BcI5XcBTnySMwFk6BjGBsEi5vAkO+hJRowhCF0NU6eKvLIAyLAi4rfBWrEG48CN5mArUlVx6BvpE4PgeT+BJKwjQcwzNXFGPiHUcMbeCtZvhPVYLtaEKktQ4T2kIk3jyV1s6NC+WpAiJhoFh0ioHJNXT0h0FrVkslx9t7RAkTmOYTYC/rkOjvRNL2An7NEjjXzZevDInEPTuLO2IOkPWnrUsxurMAbm0JmJvN4KheUaYbkfYG+CuWw100D7Y1OfIKGAejkgRZk2eWTYthUa9AvzoPVvUyODbngipaBGrDAtgLcuRtRCSoW0zGjwHhp8B/a8UkYCCaQjg+KUkMevi0JDKuAh+bwtQ3gE9NwcP+OAU7zc1aImMBUvekB9BMEtQYLwXvFUtTcYGZWvGvKCZQqjFK/PkxMv6G4kmYKVmBtATIy0owa4E5/S3/1wtKz6xAViArMOcC3wH+VK3IIaDrKwAAAABJRU5ErkJggg==",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Stop TimeLine (not implemented)\n`;
    }
  },
  {
    id: "ext_main2_999_2",
    name: "----------",
    description: "---------- action",
    category: "main2",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAATUlEQVR4nO3WzQkAIAyD0Qzf2bpWRQfwBwwifA255fCOlaRytjSPxshwEXEGyMyrBQAAAAAAAAAAAPAXoI8d3QY8fctXA3cAAADwHNAA1Q8YAMbbG0AAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: ---------- (not implemented)\n`;
    }
  },
  {
    id: "ext_main2_999_3",
    name: "Info",
    description: "Info action",
    category: "main2",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAATUlEQVR4nO3WzQkAIAyD0Qzf2bpWRQfwBwwifA255fCOlaRytjSPxshwEXEGyMyrBQAAAAAAAAAAAPAXoI8d3QY8fctXA3cAAADwHNAA1Q8YAMbbG0AAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Info (not implemented)\n`;
    }
  },
  {
    id: "ext_main2_321",
    name: "Display Message",
    description: "Display a message",
    category: "main2",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACoklEQVR4nO2W7U9SURzH+Qt6Vf9DtbXe9rZXZq62NpvrYTqX2YzNHpibLzKolU/TUYmiFkXOnjBkdRVpzYFmkhfiJspFA/EJBAXFDBRF+3aIMdT1YOMiq3nOvvvtnp17v5/f79xzz+XxeDwkU+D9vkcaxsfHOZdIJPo7AJ1Ox6n+H4Aeoxle/wLWty+Ly1Cqu9FKaZIH8HFgCMHARuPN7RtRFz3IPQAzOAz/7OwGM98isPwLkCftfdwBaD8wcLmcPx68QvQ1HDWZIsXwr8VBPEFyvRKHKLot4wjAwMIfWMKoL4wiKYuCKjNyS024IrVBQs2g/s0c+LUOnL87gpJmN7wEYpUAtNETeCBXJAbQq+9Fp/4TpoNr8IaiWa/PPKKReYD1xuPwHOAiEH2OBZzOFyYG8FZvQkc3gzHiaJwM46psCoWNLrQPhHBT4cGNp04Uy8dwvXkC1a/dkGpmYPYRCAKps/qQniVIvAKtWgYWdwijAZKhLyqHH7DPR2NsjPEAtIvEGaCfVEJFO3Ekqyjxd0D8uA16mwdWYlhCMi2osSFfbF0nC/g1LArr7aimvOgjAO8nV8GvVOJkdnHiAAqVGk0aA7qG5tBPMmbIGkfKbHJHY2zMQHbpOzLWYQ3ifudn7D5wBrKmFm6+A+VSBRrbaWgsszB646abzV+xAUjUVuxLE+D4KQE32zCma6UNuFj+DA1qM57Tbmida9BPEwiyOyg2iBrNEPIqlNhzMBvpmZeTcxa8VLXhRK4QaTm3cPRCFcoUNCg7kFemwq69mdh/6CwqxLKf3sv5aVhbJ0cGvw49S8DhcxLckzzc/uO48o4Mlx6ZcKy4BS2t1PYDxJYlI0eIF8oUAWxV/xZAZHIytGWAlP6W/2lCsvsOwA7ADkDKAb4DcfD/s/O3EqQAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Display Message (not implemented)\n`;
    }
  },
  {
    id: "ext_main2_322",
    name: "Show Info",
    description: "Show the game info",
    category: "main2",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAADCUlEQVR4nO2WW0jTURzH9xIJFZgpQUFERFRWkBb0UA89SFcrtEakrDHMpYKNxbyMBXszYg8lEcOXLkhYexAlKJHF2Njmf5ubuzpbm7vYvOBlN23t9u2/vzCih277Lyk8hy/8/+d3+H8//P7n/M5hMBgMFFJg/LhnG3w+H+0Si8W/B6BQKGjV/wVA2KYxYg2CyMoWJJ+nYR6fKjyA2uiFzTmFdCqNb1s6mYI3GIXOToJYHYUBGBmbpMySpDRRoM+dgdSUwiMCeGUD4plsNAXbZBjvFUp6ATRjXsrcOAvwBoGu/nmcbzfn1NG7gmpJBjoPlQ9Y3CEolUr6AKy2CbjmgHMPgPouD47eMuBI22pGDK4l7BXM4iTfi+O8IBbJ7HinY3gsfUYPgFLvooyapcs42OinzLPazjRgPpyAwrSI4gtqaqy01oy2Hj8y6QwUhAsymSx/ALXBheBCEhXNLlTetuYAimrsKKpzYWOdGxuYbmps941RnGg2IkkuSqtnCZ2dnfkDaEc/QueMYk/dKCoaTZTRvnoCp/gWDJojGDCEcEj4CTtqtShnj+IAS4OF8DLskyFwOJz8AfTWAByeCHYx1SSAMQdw+q6Z+jVaywy2VmtwmGPA/pt6lLNUCEeicHgjYLFY+QPoLAEkE3FUcNSksQ6V3FWIsqsEBUDYZimAbGxnrQpXOrRknYhDY/SBzWbnD0CQW/BLIoGHfU5sOSvPrYGSmu8BCBSfGYKc8GJmYQXd0l7weDx6tqHJOUNaxXH9nhabq4ax7ZIGpdcMOYCSy1psqnoHcY+RmpdNP5fLpbEQ6cfhn1smPx4jTUwou/gWVTwVmGIrqtt1ONaowtN+Oxn/jAl/DK38DgiFQnpL8ZshDZyBGLUe/P4pvBgw4YnMhmGNG6HwPCLRFTh8EYjE98Hn8wtzGPW+fA3tWADjvigmSJgPpJz+KPXeLX2O1js8iESiwh7HcrkcEokEAoEALS0taGhooNTU1PT37gN/on8LIDu5EPplgDW9lv9sQqH7OsA6wDrAmgN8BffuvsWS/9VNAAAAAElFTkSuQmCC",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Show Info (not implemented)\n`;
    }
  },
  {
    id: "ext_main2_323",
    name: "Show_Video",
    description: "Show_Video action",
    category: "main2",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAwElEQVR4nGNgYGD4T0v8nwE/BIH/Dx8+pDpuaGggzQEHDhygKh51wNB0gHfWIYoxxQ4AAUrooR0Cm84++7/l3HOwQcsPPgKzN515RpI4RQ44efft/9P334EN3HXhxf9TQPbJu+9IEqfIAVeffvp//fknsIHHrr/5fwPIvvrkI0niFDng+cfv/19+/gE28OrDD2A2SIwU8aGdCEez4YAXxaMOGHXAgDkApJgWmGgHDGiznJACWsNRB4w6YNQBA+4AAJLavVuMUEFZAAAAAElFTkSuQmCC",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Show_Video (not implemented)\n`;
    }
  },
  {
    id: "ext_main2_324",
    name: "Splash_Text",
    description: "Splash_Text action",
    category: "main2",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACCElEQVR4nO2WS0sbURiG5y9YXGkF1124664i4qWixeLWRBeKETU03qWU6qCmC41igpq2MRqFBhHxhop3Y6VWJImKKzdNsnHXHxBNfD05M2qipHW+GLLJDA8zzLnwnPecOTOCIAiIJxD+fYYO+Hy+Z0cURWUCDofjWVEsYF78Dd2UG3UTLtRYI9Ewasfd0NoYky402FyoZ4TqaqxOVuaEhpVX285gWjiiCVSP7iOz+xwZvd470nq8ePnFi3Q9u+/1IL3Hg1TRy/DgRacHKZ//IMfyF68GLjCmNyJYn4UU1RzsdrtygdqRPVQZHVD3bUHdH4WIsk1O+eAuyvu2GTuoHNpAhmoaBoNBuUALi1Y6AkSCvHVu2ypNoNl6yDsoq9I/CcDPuJS5kq/XyG1Zpgm0Wg54B5EdK8HPB5DXtEQTaP++zzsY/nFAQpIIIr9xgSbQZvklrwG/HOktShK4ZgKLxAS+/VScwGOJAAp08zSBjq97YQlQ1oA0BQW6OZrAR/MOj5A+/5JA4YfZ2AToo5cE3sYqQJ//GBP4NLIZloDSN+BeoEg7QxPoHF6XBahbcYC3L9ESvwUdAyswTZ9iyH4ShpvhfPAsGses/QleqyZoAuapNb7Hl1SIeBdO5T3F6i5kv2/Cm9LGqOSUamkCCf8jSqhAqHI8eLJAQn/L/1ch3mdSICmQFEi4wA1Ogejv5kM3kwAAAABJRU5ErkJggg==",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Splash_Text (not implemented)\n`;
    }
  },
  {
    id: "ext_main2_325",
    name: "Splash_Image",
    description: "Splash_Image action",
    category: "main2",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAADIklEQVR4nO2WyU8TUQCH+y9gPIkk3kw86MkYV0RAUBQhEYMFCoEIsVRLhYrIVqDsLUuRAqVslTQEaFmUXbBAWigtZRFj8EDLEoIsiQcvGMrPaWmEMUHtAOmF9/IlM2/Ll9/MvHk0Go2GowS0v1dLwfz8/KHD4/HsE1CpVIeK3QJlbSNgywx4WjOOJ1VkIgmiqg1g1RLUjSO6dhxMAsvYyCo90adHJNEfUfsJotYxagIR4mGcSZ+FC9/0m1MZJpzOMsE5k7jmG+GcYcRJnonAiBMpRjglz8G1cgPnhMuQZhbDzDwPpyAl5HK5/QJRpYMIL1YhOO8DgvP3gdTXZ4Ve8BH0vH6CATCKeuES1ACBQGC/QCwR7U7ZoojZOtuN20lN4EXVqE3gJx4Fh9mNZR6wDbfY99QE4io11gWATeuCgtFvyB9dQZ6NfMu9dsXaJhhbg1C9hKL+L8jVrdsENq367px2agIvJcO2BHYEZBMLkGiXUa7fQMX4OioMa5BMEOhWUdI7hcI2NaRdetQSUrsJmOER00pNgFupJgloP7egZ1iJ7qEONE0von7mO+qn1yGqbkBOVhbE/Hy0ikqhlyr2JLBNCLRRTKBiiCRQN7gEpXYOHUP9kA7MoFE/D8k7NRLjOOClpEHXI4CuqRJTncV7EtiCJ7uFmkB8+SBJQKnQoLlZizSpGq8z2/EsuwvRhW9x+cJZPI+4hB+GW5BLAqFRMEmPwJOtpCaQUDZAegkV6RLI+RLk5jYhLa4IkYGvkNw4gft+/kgKvIqFhDtIC3FHV6wfSeD28+aDCux8hl9ZbIwwmMjmCtHmz0HujcdIrZIhJScJ8Yyb0Ig9IONfgaQggCTgdXCBnQRWEwKwFBKAWa8wLNIfQubtDw6PjhIxF5w4BhI9vJAe5ofQ1NDDSSCxtI+UALWNyAxvViM1gZQ3PTYBqlvxlnW+D4vivyBe2AFRwxSK5JN7MBDo/2jbjwli/iQuBtVQEyiTdcM/PBM+ITzc2wtjl7vBqbj+gINrvjH74urLoibg8BORQwUsg4+C/xZw6LH8XwOOuh4LHAscCzhc4BcXa3R3SznQSQAAAABJRU5ErkJggg==",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Splash_Image (not implemented)\n`;
    }
  },
  {
    id: "ext_main2_326",
    name: "Splash_Web",
    description: "Splash_Web action",
    category: "main2",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAD3klEQVR4nO2WfUyVVRyADy11LT9ma22Fbs3WH8qSRmttJCEL+uIjGW0ql9BBgCHjy4BhIZBAiWiAGMbl44qCRMSnQnx2iZGIXITRkO8LIdQcJKIgMLhPF7zeos2KFxn/cM6e7d3O75zf8/7ed+ccIYRgKUH8e59t9PX1PXLCwsIWJqBUKh8pCxZILLiMT3ojH6epcEuZj7sWj9RGvBRazqo4qFDhqWU21j2lQTvWgLt23FXRQnx+vTQB169reP7zdjZH9Op57mgvm6J6MYzUPkeoMTyq5umwXi1qnjqiZmNID+byYbadGCQ5Mo4Zz+1slOWSmZm5cAGP09W4xClxiq7A6fhDmDdWPofjyR9xjK7UUoVzbBmbZVnExMQsXOCQtrT32zT/bNMzM/SPTNDy+zg9Q+OohycoaL5JRt2vXFANMjRyRxs1MxdrEVAsTcA/pU6XbkqfWKPRUDdwl4+qutijrOKDylR8app5N6cN57gSymsbiS27TtW1Dt08DRaHLkoT+ET+89wCMKlPXtTdj1VJKr7NSsqH21Dd6sDjij3rEytZHdKN57kacuu7qG/t1s97069QmkBgUo3uve8v1PXHJKa5vrjW7yBvoJzW24NUjnayt7aYtfJ6RHgGq4JtCU8rZODmsK4CM1j65ksTCJDXzhMIqhph3bFcAq9+Rbb6F4Jb9hPV1cbrxRoMTqkREbYIvw2Y+B7memefbp5GK1AgsQLf/DRPwDyhm20xPUSpbmBa5MD2fAVbvtWwKnEKEVWBOLwV4WaM4T4ZpcrLugpMY+WTJ00g6Ez1PIGdce3sv3SXrbFtGBw7w2NxXyCOX0WE9iOCHRHea3jSbRNbHAIpLqvWfwIrn1xpAsGJVfN+wsDKW1jIf8NgXy3iwDXEZ2aIkGcQB5MQThd53CEEI/fdGNuFU6G8ohd4yztnsQJT3Lg9iU3hGOtlpQiLLIRtEUIWhHB9AWFzDmGewdo35Jg7JrPLJYrOnn69wNuLF5ikUj2OcUIHJm5y1llmscZUwQbrIFbv/JInTM/yrGU2RruKeMkqnIzvSxi/N7H4Cnx6ulxfgfy2UV6MbiI9rwx/eTVGbuWYaMv+8u4yXttTwSv2FzCzDyXlfD4jo3fm9owHAu94ZUsTOJJQqhOYpn9oFFtFO9aJDRxQ1BFwKoeQk+fxDk/FPzyJhOTvaGhqZWzsni75gy1cg7WXxLMg6MQl4rOaic1skkx8VhOvytKkCSSm/4C9SyTWH4Zh83ec/+I9p1DM3vdjh53vQzG385ImsOw3omUVmA1eCv63wLJey/8rYKn7isCKwIrAsgv8CcU8dMng22omAAAAAElFTkSuQmCC",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Splash_Web (not implemented)\n`;
    }
  },
  {
    id: "ext_main2_327",
    name: "Splash_Video",
    description: "Splash_Video action",
    category: "main2",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACLklEQVR4nGNgYGD4T0v8nwE/BIH/Dx8+pDpuaGggzQEHDhygKibZAdM3Hv+fv+jc/8z5Z/+nzkXFaUCcPu/c/5wFQLzw7P/sBWf/ZwExSG3a3DNAuTP/04DyyQsu/5+04RR5Dkiedvi/QtPN/7ItD+BYqvnBf5m2B/+lW4Hslvv/pZvv/xdpeADE9/8L1d3/L1h777/97Lf/tXqf/Z/TOvH/3yy9/4LR6/4vW7aMdAekTz34P2nigf8xXXv+x3TjwChyu8E4qm///6iuvUC873/chF3/ZaNX/O/p6SHdAcXAoIWAP2Tiv2DdjqXbyHNA0dwTYIO8sw6RjUH6HYu3kOeAktnHoD75DzWMdBqk37lwE3kOKJt1mCoh4FKwgTwHlM4+CjZgy7nnYMOWH3wEZm868+z/prPPiBKHOGAjmSEwE+KD0/ffgQ3cdeHF/1NA9sm7IPyWKHGQftf89eQ5oHzGQbAB159/Aht47Pqb/zeA7KtPPv6/+vQTUeIQB6wjzwGV0/eBDXj5+QfYwKsPP4DZzz9+B2NixEH63fLWUOYAShOhO6UOoDQbkh0C1VN3UyUEPHJWkeeAuik7gQb8o6Ao/gPW751DZl1Q3rv1/6QVF/9PWHYBCZ8D4jNoYrjweaD+C/9No+eT54Dpi3b8D0xq/e8d2/DfBxnHIbBXTP1/W//C/zZ+BTixvV8OeQ4Y8BbRgDoApJgWmGgHDGiznJACWsNRB4w6YNQBA+4AAIXelZXs6t6AAAAAAElFTkSuQmCC",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Splash_Video (not implemented)\n`;
    }
  },
  {
    id: "ext_main2_328",
    name: "Splash_Settings",
    description: "Splash_Settings action",
    category: "main2",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACGElEQVR4nO2W2y8jURzH518gnlySffbgzRsRcQ1CvGp5ICprG3UXcZugHmwJgu5udZWHRkTcsivuirhE2iKe9mXbvnjzB5Rtv85Mp+10V5dzqulLz+STM2fOmZnP/M5vZg7HcRyiCbj/b0KBy+V6d3iepxOwWCzvCrWAfuMCmkU7Ps7bUG8MRUVo+G6H2kRYsOGTyYZGgjBWZbSSPitUpL/OdIep9Ss2gbrZU3wY/IW0YWeA5CEnUkecSNGS/WEHUoYcSOKdBAcS+x1I6PuNHMMD0sfuMaedhKcxAwmKVZjNZnqBhplj1E5aoBzdh/JzGEL69kSqxo9QNXpAOETNxC7SFEvQ6XT0Am0ktL7yB5GU3I4tNoFW46V0iUdJghYPwYvcth9sAu2Gc/ECgBt876yIsO8T8iO0n6Ra3vck1UBeyyabQOe3UykCcgHfDfzt1xCikN+8zibQYTgLCIQ+NQ1eIrDBGIGvJ0EB8UROFtq34BZzoUCzxibQ9eX4BQE39RQUaFbZBLr1h4EkZJ8CDwqbViIVePwnCWkEiiIXiOwtYI5Az8xeIAK+5KNJwGAEitXLbAL90zuSAMtX0I8XpWrGf0HX2E9MLd1iwnwjw06w/nUsHNfk/BtkKubZBPSL26is1aK0mkeZnJogJcoBZFe0IKu8OSw55Wo2gZiviGIqIAyOBm8WiOmy/LUB0d7iAnGBuEDMBZ4BpdLsVXxRGhYAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Splash_Settings (not implemented)\n`;
    }
  },
  {
    id: "ext_main2_999_4",
    name: "---------",
    description: "--------- action",
    category: "main2",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAATUlEQVR4nO3WzQkAIAyD0Qzf2bpWRQfwBwwifA255fCOlaRytjSPxshwEXEGyMyrBQAAAAAAAAAAAPAXoI8d3QY8fctXA3cAAADwHNAA1Q8YAMbbG0AAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: --------- (not implemented)\n`;
    }
  },
  {
    id: "ext_main2_999_5",
    name: "Game",
    description: "Game action",
    category: "main2",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAATUlEQVR4nO3WzQkAIAyD0Qzf2bpWRQfwBwwifA255fCOlaRytjSPxshwEXEGyMyrBQAAAAAAAAAAAPAXoI8d3QY8fctXA3cAAADwHNAA1Q8YAMbbG0AAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Game (not implemented)\n`;
    }
  },
  {
    id: "ext_main2_331",
    name: "Restart Game",
    description: "Restart the game",
    category: "main2",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAA3UlEQVR4nGNgYGD4T0v8nwE/BIH/Dx8+pDpuaGggzQEHDhygKh51ANUdkH2s+L/lWkswTgayQWIMcxho74A59+aALULHAnME6OMAbJYjY5o6ABTcIEuyoUGOLEYXB4CCeem1tShimmsN6eMAx22OREUHXR0waMsBbI6laS4YMAcoLjVEkSs+tvQ/BzCh0q0cMARmQZi419ZssJjmUkv6OYDuBRHMAbBiFx1H7Z1CHwfAghwU3CAMYtMtGxJj2YCXA0PfASDFtMBEO2BAm+WEFNAajjpg1AGjDhhwBwAAea52TO45+K0AAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Restart Game (not implemented)\n`;
    }
  },
  {
    id: "ext_main2_332",
    name: "End Game",
    description: "End the game",
    category: "main2",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAC6ElEQVR4nO2WWUhUURjHp0gKw6Sk0qikNCG7LhmmY6G5pFNj44yamEuLOplLaEaWUTIiWVZmi6IvRvUQ9hIauKSpow8VPQeVDjrLnZk7zuZIhjDGvzNXGqGHFroi1JzDH+537oH/73zfOfdcHo/Hw2IKvJ93R4NKpeJcMpnszwDkcjmncgH8NYCpoRKTNYVgKrOhL0+HrjQFuqLD0BYJoZUmQnMyBprcfVCn78bHJD9uAUx3LsL2vA3WR7dhulsFY305DLXFMFRLYbiSB+ZSLvTnMwiUCHReLMZSQ9DH9+EOYPJaCayPG2BukcF4owxT7S2Ym7Lge5szG2Bpq2fNNTlRUKSF4lX0Vu4AmKrjMN27zK58uuspa/p5oBOTdY5MlJDnDnZsqr0ZKmLuyMBAnB93APqyNJKFUtietbBG5gcyaAuTQZ+KgyY7itQ9FMa6Uvad6WYFFJIgDHIJ4NhwzNV8fLVZMTPSQ2IJaKnAWQJ1KgW1KAAzQx2w65RQiAMxFLuNOwBtwUEwF7LmV99cQwDEJAMLAPRRCrTYH6baAjYeF+3AUMwW7gDoEzFsGZwAZwnAmQUAXSYFXaofLNelbDyR7Av5fm/uANSZ4cRQiDmrETOv+wmACLriQ04AJicITIY/Zt90w64Zg1LgjZHIddwBqCQUu+EsD2+xhpbWWvIRSoT+9AEw+REw5FKwNVXMn4SGEqjiPTG8ZzV3ABOC7dBkRYLOj8f0iyes0Ze3/bA0VsDaWIbZd33zY52tMAjWQBW9CsPBbtwBjMf6QCWmoDkWQTZkAsxN1bAzamcJ7LQCtvvnYBB6gYl3h5K/AoO7lnMH8D5yLT4l+GL0SCBGJSEYkwQTUeS878REij+Uws1QJq2HMs4Dyig3fAhbhq4AHreXUVeoJ3r3bkAvfxN6iPr53njJ34iBCC/Iwz0gD3PHYMhKyKnl6P7B/N+4jv8vAMfkxdBvAyzpb/mvJix2dwG4AFwASw7wDcyxlBDTrxc5AAAAAElFTkSuQmCC",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: End Game (not implemented)\n`;
    }
  },
  {
    id: "ext_main2_333",
    name: "Save Game",
    description: "Save the game",
    category: "main2",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABkklEQVR4nO2Wv4vCMBTH+y85ujo6iYuQ1dHR8RYHl+43dhCPDgU7nFpBtOCkWwaHTFrQpf4Yuggdv/cSKhwn1TtIrhxnw5fSvCTv89L3QizLsmBSsO43+WC322lXp9P5GcBisdCqvwvQfglRrfsIAg4hBDjnuZJ23+eoVl0wmqMRIAAXMdIUSJI0V9IehhEYW+oHECIhJ4mKMk/SbhaAQoyiOFfmAdQOROTsVrL/lwAK/AWPkzA1BeBTmcXKgcyD9I6MANRpBxgL0O0u4bqy1gVcP3u7mbJvxxFoNjnN0QggF8yTipb0ua/V4np34LqwbdsYjUYYj8fo9XoYDAZ0QgZqnDwJG413lMtuBmUAoN/v0zHroFR6xWw2w2q1wnq9xmazwfF4RK32pmyMhWYAPM+jCB0lCSCdb7dbxHGM0+lkHmA4HKJScdBuB5jP58r54XBQ9X8+nwnAIwBHL4DUNbEmkwllfKhKcjqdYr/fK+eXy+ULgMYcKPw+8D8B5GAT+jZAodfyRwNMtyfAE+AJUDjAByHMxSSJHxBpAAAAAElFTkSuQmCC",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Save Game (not implemented)\n`;
    }
  },
  {
    id: "ext_main2_334",
    name: "Load Game",
    description: "Load the game",
    category: "main2",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABa0lEQVR4nGNgYGD4T0v8nwE/BIH/Dx8+pDpuaGggzQEHDhygKh51AM0cwFHN8V+gB4JBbLo6AGQhzFKQAySWAh3Sgt0RFDvg3CJFFAxzALIamCOo7gCQhejg2CwJDEtAvtdcK4E1FMh2AMgiCJiDhiGOQMYgi72OGdLAAZ+BFn7uwcRQwFHMAPZ59jUnOAbxQeLUccDrlv+PDvpj+BgZgywDxX/P8ygwjWw55Q643gKmb+3PRiSC398x0gXMESB6Ya0E9Rzw92o+mP7+oRNLWkDFIMt//5z2f3YVFR3waLPT/5MLFIAWLP3///sUvPj5vqD/5/ZE/19axEM9B5xfpPr/+g57iC+B6QEnft7y//0uJ6xZlCIHHJsl+f/Dk0qIAx5X48b3q//f2+T0f26VJHUdcHyONMTy69kE8f6ZGhjBT3FJCDKQFEzX2pBYPOoAkhwAUkwLTLQDBrRZTkgBreGoA0YdMOqAAXcAABkYoRbhfDLIAAAAAElFTkSuQmCC",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Load Game (not implemented)\n`;
    }
  },
  {
    id: "ext_main2_999_6",
    name: "-----------------",
    description: "----------------- action",
    category: "main2",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAT0lEQVR4nO3WzQkAMAiD0YzuaK7iJJYu0B9QSuEz5JbDOypJ2dnUOvMyIsprZncAdy8tAAAAAAAAAAAAgL8Ac9zRY8DTt3w36A4AAACeAwbq3OtjR9lqIQAAAABJRU5ErkJggg==",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: ----------------- (not implemented)\n`;
    }
  },
  {
    id: "ext_main2_999_7",
    name: "Resources",
    description: "Resources action",
    category: "main2",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAATUlEQVR4nO3WzQkAIAyD0Qzf2bpWRQfwBwwifA255fCOlaRytjSPxshwEXEGyMyrBQAAAAAAAAAAAPAXoI8d3QY8fctXA3cAAADwHNAA1Q8YAMbbG0AAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Resources (not implemented)\n`;
    }
  },
  {
    id: "ext_main2_803",
    name: "Replace_Sprite",
    description: "Replace_Sprite action",
    category: "main2",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAB5klEQVR4nO2Wy0rDQBiF8yy+hbsiLhSXghvBy1bfwRZEF3ZlwcvCIKhFW0E3IiiosSCKCEYXmupCC6JotFBJkAjh+M8kqWma1kumiNCED5IwcL45TCaRJElCI4FU/2QHCoWCcBKJxM8EFEWpyXG2s4J6Yz2ECbBA0zQr+I6EEIHP8FwAs6qVYDsCBXKwi9swtCx0bbaMoT1y7OJ7aDPCBAxtCfreEO4W2vDog93fLHZzwpqILCDLMi4oxFJTPNDajQOaBpRK4Ae7JixCJ5wm1nkTB5n+6AKxWIzPEqejXADaNJGm5BPKTTvXLhZhaJuwr6dIYAdKVAE2eybAgzcH8bzcQUGrxHwVFqETdnEf5tUE7vMpHC32RBNg4Xl6zgRKK1142+pzZ5sqYxE6wdaIXdxw6r8cwa3SD3UjYgNMAK6AU/+EK5Ck4CQFJylYpuA1Cs6UeT0bQS4zEP0t8Avo6XYnXI1DJwx1EvbDAswXuYprZZjXL0yAcT7WWsEJsUscjndBnevlgX6E7APeGkAN8i4zLS1l2MIVthV7b0EtgaDMkyvjlxCyD9RrISjBxgsV8Fr4SiIsXNi3wJMIE/GCw8KF/g8ERfyEBTdE4Df8LwE2uBF8W+BPf8u/GtDosynQFGgK/LnAB6PXfIQOTe6sAAAAAElFTkSuQmCC",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Replace_Sprite (not implemented)\n`;
    }
  },
  {
    id: "ext_main2_804",
    name: "Replace_Sound",
    description: "Replace_Sound action",
    category: "main2",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAADO0lEQVR4nO2W30tTYRzG94dEBJXVTZBdxIgijC4cWDC8GsKY20Uhi0jTarlNOzixIWajRBZL5yxXg9Dmr9SNUqOF0+bcZM7VLDTtrBFeePn0vl9ZKNjSOfXGHR7es3NeeD7f5/11JBKJBDspSNJf/Id4PJ51GY3GrQF4vd5/yufMX6d0fVPKGgA3TCaT6zTclrc7ANyIGyYSdohiKxYXbSRRFOndRsoqwLvWC1iKP0N0sgZjwxWY+HAHgY86TPruYWZmhkD+lcy2AXr7euG1nUNw5DZ6bflwCIfxvOYoOmqP4WXdCdILUw712SiJjAFcLjfcbjecTifs1Ycw0VlK5t2tagSDQUxPT2N6KoBIJIJYLIZwOMyGKLGawuwjajvqMwRQq80IhULw+/1QFavQYjwI/2sNgfjYEAQCJgZQz8wbEI02MgAL6/8ACwtPmbEDyZEyiD9b0GbOAKC01ILR0RBWVlYIQCqVUuXhN0oMOy5hbs6GaMiMoP8+YgziOzP/ykDEeSvCn01Issk567kO32AZXtVItw4glwss+hCrZgUWiwV5eXkEMO66gok+JQNoQnTMiMD7W5hjk3I+XEf69aURkU96JGYe4ttAMY2/+0kGCchkOgiCm5mPUvUcwG05zSbZecwGBYo7MlKBoIcBjBkgMvOlqVosxxroeWKqDqHuYrSbL2a+CkpKLDQUHEAmk6Gr8RT6m6Wr1Q9pERkoQbD7Gn747uL3ZDVEvx7LUwI9T4zr4bFfpvi3tQwLCtRUPQdQKNR4fOMIUw6abp5Ec1ku03G4TGdJDkMutfVXD8ApnPlrvi0AU62ZzOVyOQMooUR0OiuTi+RwONhkHcXg4CBbsqv/VSrV6r6Rra1YqVQy41KSQqFjQ2OlNKxWK60QLm7OQTio3W7P7llQqa8kc0EQSDqdjirmhtx87X1RUVH2D6P29nZUVVWROY84ZZiKnd/zVqFQoLOrc2dOw/LycjLnsfN9gd+nzLnSmWcFwOP1wGAwkPnaBNRqNQoLC9OaZ+045hB6vR5arZYmpkajoRR29YtoyDOEnt4eUv/b/k2ZbxmAd94JbRpgTz/L/9dhp699gH2AfYA9B/gD2vuIhliGxu4AAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Replace_Sound (not implemented)\n`;
    }
  },
  {
    id: "ext_main2_805",
    name: "Replace_Background",
    description: "Replace_Background action",
    category: "main2",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAADHElEQVR4nO2Wb0gTYRzH7+VFb/bSt76IWu/2csQI16uGiexVjF65V7GwP/NNTGrYEIkHMTqS9GTIvGTVIVlngjs3RScprYk1o3LoGpuabA2RIb749txdWq6ynLd84x0ffnfwwPdzv+e5h4dhGAaVBMzet3JhaWlJd7xe7/4EIpHIH5l+fH4Xe43dRjcBJTCfz+9ios/6fwSUIC1UKEGT+B36C2RoYObhr5R0pbQzZQlEo7KGLEOmTPSeRW6hA/OjlzHea8G434KIQs8ZlVHKSLdZpbQTZQpEIcTy4ClKHe2vQ2auByNCLabH7iJT2NTIras1XdhCOldEOpXSurBwX63B9gMKCIkiuFgRL/vrkX13D5FgPdIrAlY3niOjsP5MQ3kuDCC1+EBbG5NNWPvSiz5yAAFCg0kCsEqA329HaOg6xP6LiK+FkFgewDINLGyIKuub2vPihw7kV/xYCDdiWm7C01ZzeQLKvPtouIfijAFBwY7BJ5cwHLqKtwUJ79MBpFYDyH2lLPfi03wn4jPtSM+1qu3/HGpQ51/qLLMDioBNJrDKPjhkAVKwlnIBH7PdyGxJSCa7EJ/l8GqqHTNTBGG5DWMjd5B5cxv5eYLEUAMekXPl/wWSJMEsmmCSjKgi1Qh0n0SAP4F4uguvJ9owFWlDeLgF4cFbCL/wIjzUgsmQF5moG/lZ+h6oU9tfvoAowik74Iw6YXCzYOwMmhuPofnKcVpPofnaGVottNZo3KhBS5MFgZun1eDt8LIFRCpgE2wqrIMKmOkIG8XBwEhMsEkc7RCPal4ES1cqQ4owkCx44tNnKxYEAQZXFVgXqwUrAiaNKpcBVsEIV9RGF6lblTGKdMoECRwh+gmowdbv4eafJGwaiiCJeSBlfRCzbrpvuEF8OgnwPA/Wrn09ay+FBWtl1eqR7AAECo9snoNPTwEzMcNE51upVu4Hdt4KN90XfJITUsKDLDiVZFZHAY7jaHvJDnyCQEhyKiJFoshJskOMhssJXl8BjlAJuqj2S8VOROWyLwFlcCX4Z4FDPZb/bUCl7yOBI4EjgUMX+AZzf2UrVGYNzgAAAABJRU5ErkJggg==",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Replace_Background (not implemented)\n`;
    }
  },
  {
    id: "ext_control_999_1",
    name: "Questions",
    description: "Questions action",
    category: "control",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAATUlEQVR4nO3WzQkAIAyD0Qzf2bpWRQfwBwwifA255fCOlaRytjSPxshwEXEGyMyrBQAAAAAAAAAAAPAXoI8d3QY8fctXA3cAAADwHNAA1Q8YAMbbG0AAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Questions (not implemented)\n`;
    }
  },
  {
    id: "ext_control_401",
    name: "Check Empty",
    description: "If a position is collision free",
    category: "control",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAsklEQVR4nO2WzQ2AIAyFO7FnB3Akzu7i2SFQEzWNsVDKg16gaSCB8D7KXynSv50llrg0T85E8W2Lap+n1QwhioewF7kVAiJeAwETt0JAxS0QanGi5a2fNgIiC5ASS/VBADQrlcbAItD6HIgAmtWnxnYFcN8C9wg0AXA/hNooNL+Grg/RV4w/x7AtuCn8PiMWCr/vGAVRlZDUQkBSMg5xTVjisKSUQ7il5T1tAAyAAeAOcABTjbqDJkg87AAAAABJRU5ErkJggg==",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Check Empty (not implemented)\n`;
    }
  },
  {
    id: "ext_control_402",
    name: "Check Collision",
    description: "If there is a collision at a position",
    category: "control",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAA3ElEQVR4nGP4z4AdAsF/UjAucwhBnJY/fPifaFyRt49sR+C0fMuW1yRhch1BFcspcQTVLCfXEVS1nBxHUGQ5g8EcMKbEEUPHAXdERAbWAfdERTEcQXcHvK+vR3EEzRxwTV0dA8McgOwImjrgS1gYCn5XUvL/Y2fn/w8tLf9fJyeDHUEzB9zk4sbAoBAAWQyzfEDSALLlA5INBzQXDHg5gA1TxQFQV5DlCFwOIKkyQgqKgauOqeUIihoklDqCKk0yZEeADCQFU61RiuyIAWuW0xOOOmDUAaMOGHAHAAAako2rr3kVIQAAAABJRU5ErkJggg==",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Check Collision (not implemented)\n`;
    }
  },
  {
    id: "ext_control_403",
    name: "Check Object",
    description: "If there is an object at a position",
    category: "control",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACmElEQVR4nO2WX0hTURzHDxdkoZaT2jAK8qEeXGAk+JAOMYqiN7PQnMIiGm4iUT5ZoFiwHuzBPxskyNZEYuFMUu5MEyUie2sRuDazjEkPSfawHvbiw7dz7u7kZru23XvLl+3w5T7cu/P9fH/n/DiHgKQf9IdsJDfP34aseSyGjNV5Y0ExhKw5z3/PSkohNDFXA5GR+cjIMpzOMFpbI3A4wujufguvN6QJxI7mExOfYWn6gtM1X3HyxA+UHolDp/tJ/7CBwsIQ6upe0++iqiBkzYeGPqGpMYZLF9dx/lwc1VWbMJkAg4HOSxJUa+C4NzCbX2IssKQYIi2A37+MxssxtFjWYbseR7NlEw0NQG0tBIj8fAhVICRKNYeKimcITn/UDqD5yqqQ/Ko1gfZ22madEJ4MorJSWoUkAMd5UF//VBsAny8Cc/U3oezMkJkPDyefcgCEeLD/QB+mplbUAzidSzCVJdecGWZSAQaQl3cfg6559QA2WxTF+uSGY2vOTFOS2wMMgOPuoaNjWj2A3R4W0rGUzIwlTml7FxCySDVJ5UZx0QPcujmjHqCr652YLiEkZYYpJZMnxPehrfR7dIM4VDKA/v4FLTbhexQUhMSEG6JhQmK8JjH3C+lLDG6UHx+lmzCiTRueqnolljeaRou/mev3DcB0zItr1hlt2pDpkS8EvZ4XjbZrUih7yrz08ENcOPscL+ZWtQNgcrnCMBr9oplUbmHNWdnLjnpwpobHE7/y8yBFkRZiLPCBtt5jevD0Cm1GSA+K9vbioLEP5aZRWFtmEQyuKDbfAtgJgikQiOD2nVm0tfFw2Hnc7ZnH+PifB5Di4zgTiH9+IVELocmVTArBJsxGml1KpRC7di3/nyMHkAPIAew6wC954fpVg8eqTgAAAABJRU5ErkJggg==",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Check Object (not implemented)\n`;
    }
  },
  {
    id: "ext_control_404",
    name: "Test Instance Count",
    description: "If the number of instances is a value",
    category: "control",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACBUlEQVR4nGP4z4AdAsF/UjAucwhBnJY/fPifaFyRt49sR+C0fMuW1yRhch1BtOXrN9z8v3LVLTBNTUcQtHzdupv/Q0Ie/be2fP5fRfnBf37+u/89PK/+374Du0NIdQRey1evufY/IvT5/7rqZ/+TEj79NzICmstw+z8Ly9r/mpr7/+/cRbkj8Aa7l+cLsOVLlvz/n5HxH+qAt0C8DeiIKf/z8s9THB24fb/6OjDY34B9DrI8OBjVAUxMLf8VlU7RzgHLV1z/r6jwFWwpDAsKIhzAwNDwX0L8IO0csG791f98fL//g81AwbeBeMl/CdFJ/81MLtPOASDs6/v4PyvrO6iv30Ith/heXXnt//b2C7R1AAjr6V0HOuIgMNHtBNIrgD6fC7R8y/8A/xNUKZiIKvkKCy//t7a+/t/O9tp/e/sb/6uqcAc91RwgJtZN0BJDw6n/OTnbwXjZsjPUc0Bu7gqgTAtBB8DwkqXH/7OxtVE3BJAdYGw8FWwBCM+bdxJFXU3t2v/S0pP/T5++j3YOgOGNm65j+BSMt178z8zcSnsHeHvP/T9hwn44385uBthB4DSwnMw0AHUF3pwwc9ZxoGUzgaXjGZxqyLEc7gBCjuDh6QCHCAxTy3IUBxATEtT0OVYHUOIIqjTJkB0BMpAUTLVGKbIjBqxZTk846oBRB4w6YMAdAAD4WGJZG9KzewAAAABJRU5ErkJggg==",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Test Instance Count (not implemented)\n`;
    }
  },
  {
    id: "ext_control_405",
    name: "Test Chance",
    description: "With chance 1 out of @0 perform next @N",
    category: "control",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAADrklEQVR4nO2WXUyTVxjHGy8k3mhDUBIxftCK6JV8GSyvbeEFatOCVhSImZmYiWSAysIMqSlKlgwKa5FSoAXb6twECR8ZZSxsyTa8cA6zoMsCyXaxmcyLbWExy7zxwt/oMSwksw7abt5wnvyT896c/+95znvOeRQoXhwLg5Uo3Dr/FmHNHz5k2Wo4+3nEEGHNx8d/W5EihViWefNYM2qnmrSuNDwzfoKTMzGDeKn55Bc/Ut1bzaHeQ4TGk2dPyPXmIvtkLo5ejAlEWPPhydvo3DrkbpkSfwktd1rwTHuwXLNwxH8EySWR1ZyFpkVDcGYmYogXmrtu+VC+rcTUZ+LY9WMcvXYUc59ZfIfmhT2F3J2/K6oy+3SW1MZUjIPGiCD+AaDr0FF/u5753+dxTjtFxiHTEMiiiq8WY/vMxtT3Uxz/8DgGj4FUWyoj419HBxB3Og59l54HPz0Q2dmn7CLzw77DFHgKyO/O/xui6GoRhd5CsluzsQVt5LhyuDk2FR2AokBB5uVMsuxZ5HTmiJJb/BbKbpRx7+d7THw7gclnovT9Uiw+C/kd+aICoWG9Y6XtVl90AKWOUuIr49lWvY30xnRR+uJAMYFvAsLkj4XI7crF7DVj7DIKaV1afl2I9JZ0yofKowOw9r3LmrI1pLyVwvaa7Wyu3EzGpQy0Ti37nPvY79iP7JapGK7A4DagdWiR2iT2vrMXQ6eBPF9edAA9Q0Moq5Woz6tJPpfMxsqNAiT5bLIAkTtlmoJNohoZ9gwqAhUEZgJo2jTiJKS1pkUHMBD8EqvvMpuqNqGqU9E/3c+GUxsEUGhb9B16RudGuf/0PvpuvQAJ/hDE6DGK+a6mXdEBBD/5jnqPlXUn19H8UbNYVNemI6kqia1vbiXPmceJwRMU9RZh6DIw+8ssZreZ2oFaHj97TNz5uOjvAffYByTWJqI8paTEU4LtKxtJZ5KeV+A9/fO9bs9DckhoHBpkl4y5x0xKQwrt/b3RA4RU7ixnfeV6Ek4nkPhGIjvrdqI6p2LPhT2YPCaMXiMjcyMccB5AviKT2ZrJjY9HY3MTLqpz2ItklUg4k4C6Ti3+gxCEdEXi0Z+PxPbsaNxBdk82gxOfRvwoLVKE7QEO2g8S/3o8W2q2iOOpa9cxMDeA5aaFqo6qqF/EpaV4aSOy+8Ju1r62FqlFQnVJRY27JnbP8XIh/MMjKE4qaLjeEPuGZLkQ/2lLthQitOBKFLOmdCnEK2vL/89YBVgFWAV45QB/AYI7+pwkUoxlAAAAAElFTkSuQmCC",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Test Chance (not implemented)\n`;
    }
  },
  {
    id: "ext_control_407",
    name: "Check Question",
    description: "If the user answers yes to a question",
    category: "control",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACy0lEQVR4nO2W30uTURjHvfDCq67qP/CiguiuuohAujCTwsKQfqBIUpCkwRB2J5SllRXkCjKm0LIsGWtubsPmtDaZe2eZC93USK2tzeZ81f1o2ta3c159zcqxtvclb/Ycvrw/zsv5fp6H855zspC1cSOBVJRonGQtofn0NP5Z0ipT2hAJzbVaf0pKF0IUcyEQopmnC5HUvM/qhJ9dxPpYiCxBqXsNlcYsGCKhOTM0jnDod+M/4wdRLwEUArEhwOC7CbCBwJqRyzWLvINtyM6+hpycBhQVdcDnC631t3XZxAPosYzA43FzAy8TBb8Dubn3yJd10LychN44zd3vP6Dg+viouSoXB8A04AIb+paw7NFojAOg1aDBEogYuWqZT2hrNwsHMPa/x0w4Dn+UZL8EREgZluPEmLgEFpZxsbqbM78tewN/BPCFAQ/5xvZxEafO1QoH0Pc5MMXGMTUXR5AMzFKQ1evNO3Yu+ysNA4iQzCmAYxYYI3O1zzmLghKJcACVyYERbxSToRUDak6zp9qzt5UD8C3EQOcg4wGGvgLDfkDFuHGopEY4QJOiG9YJH5zzwCjJbnL+l74EV8Q/034bAej/HEPlDSVOlEpFqIB6CI8MdrxyzWGYJRnOrZaZiGZ/vFzLvbOTv9TsBfTOMB72jGPrrtN48swizjpwV25AcxcDw0gAg6S8PAg1r7psWTNXj4Yg0zmxI1+Coycl4vyGvG7JOnGh4Ske6BxoZ7zodcdhnSEwZDJqRsNoMrhQcV2JbbtLUVB8SdyVkJe6cwzHymuRX1aHw+cbUf+cgeYDUFGvwpbtxdi57wyaW4zCluJViqQ7oeKxGYWV92Eha1TeWRnkLTpRdsT1pUgKQbOtbn2LI9IOqF78vf6nvR2nAqFSMygsq4VyAwBBB5JUIMTIPCEAD0EHTEWiHUrXQ2zasfx/tgxABiADsOkAPwHi29dicYJ5gAAAAABJRU5ErkJggg==",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Check Question (not implemented)\n`;
    }
  },
  {
    id: "ext_control_408",
    name: "Test Expression",
    description: "If an expression is true",
    category: "control",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABL0lEQVR4nGP4z4AdAsF/UjAucwhBnJY/fPifaFyRt49sR+C0fMuW1yRhch1BFcspcQTVLCfXEQQt37z57n8/v3n/BQQ6gQpb/vPwdPx3dJr1f/3661RxBAHLb/0XFu4CW4yOOTnb/69afZViR+B1AMjnIMu0dSb9X7v2Glhs7drLYD5IXF9/Cm0dAAv29RtuYoQMSJyZuZW2DsCFN226A3YAKHoGwAE3/svL94EdUFKygb4OAKV8SckesOWgnECN7Ei0AzZtvgfPEeHhC6lWHhDtAHePOWDLIyOXExVaVHcAqAACOWDjxlsD4wBYAURsYqVpNhxeIQB1BUFHkOIAkiojpKAYuOqYWo6gqEFCqSOo0iRDdgTIQFIw1RqlyI4YsGY5PeGoA0YdMOqAAXcAALHIlqQfFrYVAAAAAElFTkSuQmCC",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Test Expression (not implemented)\n`;
    }
  },
  {
    id: "ext_control_409",
    name: "Check Mouse",
    description: "If @0 mouse button is @Npressed",
    category: "control",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAC7UlEQVR4nO2W7UvaURTH+wMLopdBSBDE2horahUL1qL0RWV7UeEqK/KB1DSz8GlWpENWEBtbNhTSMh9nz7MHKfzu3MsmhpNmXepN93JQfvx+9/s559xz7i1D2b8nDZRixda5bRYV393Ff1v7y+U7QxQVX1xMlWR3hRAifh+IAnGLJYrpaTtUKi90ugBmZ91wOLz0zAWt9gfM5hgWFn4KgyjwXKNxQak0QyabI3ErrFYX9PpF7OzsQKHQYXR0DXNzUWEQBWFXqTwkyMQtUKuNaGoaQGurFG63Bxsb67DZlmAyuTA5uUrvBSliiXtBFACwRQcGZtHZ+R6NjVIKuQ3Hx8e4uspgZsaNlZWvYGNzc5Pe01BqvmN+Pi4OgC2mVm/R4nbI5RpcXFxwwUwmDanUhYYGA0XiM3w+H5zOj+jqGqeo+SglSTEAzFhYjcYw7QcnUqkU/H4/Eok41te3SGgNsViEvtlFIBDAxIQKPT0GGAwhcQDM2CbTah0IhUI4OzvD35HNXuH09BcODw+xv7+P7e1tSlcfRkY+3UiFEAC9fgnX19c58UwmQ+KnODo64pGJRCJ8f9jtTrS1fSBgv1gAnW4Jl5eXOfGTkxMuzjxPJBI8DewZ+9/c/A5DQ6tiAVQqB9LpNIU9mws585wJRqNRBINBnh5mg4ND6OiYEAswNbXMxVjYY7EY4vE4F97b2+Pi7JfBnZ+fU/OaQm3tW3EAzLTab1RyXzhEOBzOGRNOJpM8LWwcHBygu1uG6urXYgFMpghBWHgbZhFgaWCizOv84fV6UVlZg/p6mVgA1lyUSi/VuJlD3CzHLK8Aj8eDuroXKC+vQ2+vsXSAPxRFIVhDksuttMH6MDY2SSejk8rOQTteQR6/QkVFDXn/jMpwnLflkg+jvFAU3Yysyw0Pu9HeroRE8gZVVc+5SSSdaGlRoL/fxts3a0R3Oo5vg3iQC8l9IYRcyfIh2IKlmLBLaT7Eo13LH3I+ATwBPAE8OsBvvpDVtpegQJgAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Check Mouse (not implemented)\n`;
    }
  },
  {
    id: "ext_control_410",
    name: "Check Grid",
    description: "If instance is aligned with grid",
    category: "control",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAl0lEQVR4nGP4z4AdAsF/UjAucwhBnJY/fPifaFyRt49sR+C0fMuW1yRhch1BFcspcQTVLCfXEXgtZzCYQxKfHEfg9Tm5DiDFEYPPASBDycXDIwRGHTCaBkYdMPLSANQVA1cZIQUFhiPIcQBZ1TE+R5CCKWqQUOoIqjTJkB0BMpAUTLVGKbIjBqxZTk846oBRB4w6YMAdAABSMmL4LrqzsAAAAABJRU5ErkJggg==",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Check Grid (not implemented)\n`;
    }
  },
  {
    id: "ext_control_999_2",
    name: "-----------",
    description: "----------- action",
    category: "control",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAATUlEQVR4nO3WzQkAIAyD0Qzf2bpWRQfwBwwifA255fCOlaRytjSPxshwEXEGyMyrBQAAAAAAAAAAAPAXoI8d3QY8fctXA3cAAADwHNAA1Q8YAMbbG0AAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: ----------- (not implemented)\n`;
    }
  },
  {
    id: "ext_control_999_3",
    name: "Other",
    description: "Other action",
    category: "control",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAATUlEQVR4nO3WzQkAIAyD0Qzf2bpWRQfwBwwifA255fCOlaRytjSPxshwEXEGyMyrBQAAAAAAAAAAAPAXoI8d3QY8fctXA3cAAADwHNAA1Q8YAMbbG0AAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Other (not implemented)\n`;
    }
  },
  {
    id: "ext_control_422",
    name: "Start Block",
    description: "Start of a block",
    category: "control",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAdUlEQVR4nO3TMQrAIBBE0T1x6hzMOnexziE2KNjH3Q+bwCBjJ/81mlvtKc4LIIAAfwOYzctLACPcu8+RiK14a/ccidiO04hQnESE4xQiFScQ6XgWgcQzCCweRaDxtfO4XiO+AxiPyG0BFoJc6BdUHAEEEECAB10Ei21CITs3AAAAAElFTkSuQmCC",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Start Block (not implemented)\n`;
    }
  },
  {
    id: "ext_control_421",
    name: "Else",
    description: "Else",
    category: "control",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAqklEQVR4nO2WwQ2AIAxFO7FnB3Akzu7i2SFQEzWkgtryoZfS9FAh/S9fDaVI+dhXlGSpz1cUxZcl/s5xmNUQRfEQVlFqISDiNRAwcS0EVFwDAReXQjjAA4BouvOqeXO+n9YQAC4mqWEOvAnw/dyZZg7w580cKL3jnEPQb8D8L3CA7gAnhd1llFhhdx2jIKoGkloIyEiWQhwNJQkbSlMIs7G8ZziAAziAOcAG0v2hMWgbvBsAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Else (not implemented)\n`;
    }
  },
  {
    id: "ext_control_425",
    name: "Exit Event",
    description: "Exit this event",
    category: "control",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAC8ElEQVR4nO2WWUhUURjHx11cMEFU8EHRxOXJ7EXJEBRUSAk10EoklxorUSfXaKMQ7UEUtUWtTFGp0FvWiFswhZPlAloymKVI5j5uKK24/PvP5HMbd5LCe/nBvd/5uOd3vnvuOVcikUigSyD58ak5MDYG0clJUfyeQFPTnKj8PwJP2gagunYVE6dkWJKlYSb5JN7m5UHxqFf3At1CM+ZiYrAmPQbk5wMlJUBWFhAZidngYAhX7upOoL+iEl8CA4GUFKC4GCgtBXJzvwtIpUB4OFa9vHDzeIr4AkpBiU++vtqRLiUl4WtUFODjg3VXV8DDA2u8ngsIALy9MevoiKITqeIKvAsL0z58ISICHXI5erKzoWbePJkhTYw3CgLGmLdgb48HtraormoTR6CnrBrvXVyw6uyMWX9/TI6MYHF9HZ3p6XhtYIBGln5wfBwbACbj4jBsaooeKytkMFcUgb7DhzBkYwO1nR2Wzc0xzHmgnpjAR0qo2tsxo1YDGxuYTEjQCvWbmUFJTjs4iCPwzM8P3RYWGLK0xAgFBtnet9cPC0uL0BzrZDg6Gj2M91Kg09gYrSSLVRBFQBEchMcsa5eJCV4ZGaGL7c2cjAsrK1qBNdKdmQkF40o9PbRSooEkU1icCvAza2TnbXxoB9vuhIbizdQUe17DVGUlPszOYJkSbZR4yJHXU6JKXx8Hd4hUgfZGJWqcnFDPeI27OwZGR7XvXJWYCDljT4OCMD89jc+UaImNRQVj+RTY47pTvM+wLC0VNRxZJV+FqrwcL7kWNDDvPrlHWkNCMN7Sgjo3NxTwPoK5UmmauCthHpfaa2y7Tm6Q26SK3NqMFZHLJJ7s9vSEIDwXfy84E7oPuWwv3ETTacFmxxfJAY58l4c76uoUutsNL8hkiOeiFG9oiKPMPUL2Ex9ra4RxggpCt263Yw1y+QsUFpUgO+cs0jNycO78JdTWtv6d/4E/5d8S0CTrgl8W2NLf8p8l6PrcFtgW2BbYcoFv6mJcN5AYT1wAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Exit Event (not implemented)\n`;
    }
  },
  {
    id: "ext_control_424",
    name: "End Block",
    description: "End of a block",
    category: "control",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAhklEQVR4nO3OMQ6AIBBEUU5s7cGovQu1h8BgYpSAuANjaCabJTSb/1x0c+f+uPOhLQRIByFE6loRGcD7nbLrsuGAdDQNwEQg8QzAQKDxAjCC6IlXAT2I3vgrAEGMxJsAC2I0/gloIRhxE6CGYMXNgCeCGYcAF4IZhwF/jAACCCCAAAIIIMABj0+MinwE98sAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: End Block (not implemented)\n`;
    }
  },
  {
    id: "ext_control_423",
    name: "Repeat",
    description: "Repeat @0 times",
    category: "control",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABVUlEQVR4nO2WrXKDQBSFr4zkFfIIyFokcuXalczUYDqDRVZGxkbigqRyJbIyM1ERfYDK070LJLT0j/QSpjPAnFnBMufbc/eyEBFhSoG+v/nC8QhxPdw/jQPY719EtQD8f4AoqUDaKam9AmORb+tPzXRukW1qOYAgLkDO0Junz6DsAMpPbjxhrct3c1VmYSrgLhMCMG413twpUCXSR+tNSFUegEE4jW5+nNcIC2CdCgGwKRm38rgcRB2atiSchmqeRw5gtQVWiRAAGzNAlNoBQBN5C8FlcRAeePPq37kJwKVMvD8OzciJGCtdgmJgzF3QKYh2LUS7SV3HiG/Cftv5tjTtyvvqOkWVMgD9MvRT8GC6+lofEvsTwCWFetD3N/sSsnETs0V4BYTIWXDekHo8hNhhxLVlAJVW8wBcqwVgFABPnkK/Bpj1t/ynCVPfC8ACsADMDvAGqDqhMjmiPL8AAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Repeat (not implemented)\n`;
    }
  },
  {
    id: "ext_control_604",
    name: "Inherited",
    description: "Inherited action",
    category: "control",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAmElEQVR4nO2WSwrAIAxE5+guejCv4kksdiVBUz9JgyWVwUqEPqZjEACypjL4UZ6cUhJXCGEOIMYoKgc4GwC4HtXr1ntrvQ3Q+wCdPwWoHfm/AzQDrZnWaWbOPwUmAL2wcdZz9SWA2fBx/WLZAQ6A1sUB6H8c6YDiDnAtmMvANoD5KXAAU4CyWUPDAKbX8rcN2sMBHMABzAFuNDNkG0Kq4aMAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Inherited (not implemented)\n`;
    }
  },
  {
    id: "ext_control_999_4",
    name: "----------",
    description: "---------- action",
    category: "control",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAATUlEQVR4nO3WzQkAIAyD0Qzf2bpWRQfwBwwifA255fCOlaRytjSPxshwEXEGyMyrBQAAAAAAAAAAAPAXoI8d3QY8fctXA3cAAADwHNAA1Q8YAMbbG0AAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: ---------- (not implemented)\n`;
    }
  },
  {
    id: "ext_control_999_5",
    name: "Code",
    description: "Code action",
    category: "control",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAATUlEQVR4nO3WzQkAIAyD0Qzf2bpWRQfwBwwifA255fCOlaRytjSPxshwEXEGyMyrBQAAAAAAAAAAAPAXoI8d3QY8fctXA3cAAADwHNAA1Q8YAMbbG0AAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Code (not implemented)\n`;
    }
  },
  {
    id: "ext_control_603",
    name: "Execute Code",
    description: "Execute a piece of code",
    category: "control",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABvklEQVR4nO2WSy8DURzF5/P5KhKbxkJqITEJiyY2tbOSWIhEYjFCKFUy3oNUX9NWKVVa1YdWmTt3jv/VEInxaPQSSefm7G7m/M45sxhFURTIFJTPj3hgmmbHpapqewDBYLCj+v8AI9MpV43OnEALROFVA/IBxMMc4IEBDctB9cHB7b0Dw8jD69ehThhyARgHmmRefyTzpoNSw0HxjsOItgA8OuDxu0N0BKBpAf4p/Z1EAx5fAB6tjJ6pMnpVXQ5ATVROqW/qHFc1jlyFI3vLEc03n0F8fg2qj6RqcgBKDe7agFmwEbuyEb60cXhhywMo0N6XVY7zMkemxJEq2khciwY4wjkbB2S+eyYRIFdxXBt40Q6Zb2aYHIDhyQhOae/0DUfyTeVHlHo/y8icQSfz9bRkALfkvwIwNHGANG1uFsTmrfRi872sje1TMj9hCKUYVpOWHIDB8S3EqfaP9l9LWVhJMCzFJQEMjIVwnG9tbpzbrx/cBqUOJhmWTQuLMYb5iKQJ+keX3lW+Lio3yZySL0QtaBELc2FJDfR5Z59f/F11HOCn6gK0BSAuy9C3Af70t/yrC7JPF6AL0AX4c4AnGNj3c/GyMxMAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Execute Code (not implemented)\n`;
    }
  },
  {
    id: "ext_control_601",
    name: "Execute_Script",
    description: "Execute_Script action",
    category: "control",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACNUlEQVR4nO2WT0gUURzHB9dNxGgRLKGEIAiVCISoU6fo1FHoEkpJIIFUxJ5iL3sYyMMex1sXD0ISRB0mkm111ZjwT1Oy7Kq7659d80/qumpua/Pmzbf3JpRglzJ4g2H7Ht/bY76f7/f3Bp4kSRKcFKTfb76QSqWEy+/3/x1AOBwWqqMB8KQ3WVSdz2ehhmLwySHnAfgiFrBLgJxhYWvXwsY3C7q+DJ+iQX6qOwtAKJBn5jvfmXneQiZnYe0rhR77CeDVAK9SCCEMIG8ASo9WIN6ANxCCV83iRk8WHbLmDMA2r5ylXt+hWNmmWNykSG9QxJbzNkhAUSEHmGRVDIDULsHdVrkPkMnRog3EV01MrpiILJn49NkUC3Dt2XlU3C+3AVbZvJe2KBayFHMZiuSaiekvvAGKyKKJj8x8LCUY4GH0Km4GL6DytodVbhVtYE+jzPz9HBELcE+/jPbxS2hQauC668bMOkXil8onWOoPacLMCTRmPjwjGICb3xlpwvXgOTR0n8SJ1lMFyR0FaB5qtM0vvqzF2V4PXI/KUNVWbafnMx9PmxiZZ+azBENJgoGEIRaAm19R62zzqk43ztyqLzr/waSB/mmC4JRgAG7O0x977LJ/ST5zfcHcv3DvWOpwguBt3EDfJMHrqOARcPParuOobjldUPkwrzzOzFnyNzEDatTAq4jgBjxyhX37H/he2B8+qIQB8Fv/T7wH/h8AftgJHRjgUJ/lfzrg9C4BlABKAIcO8APxfbFINx6zkgAAAABJRU5ErkJggg==",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Execute_Script (not implemented)\n`;
    }
  },
  {
    id: "ext_control_605",
    name: "Comment",
    description: "@FI@0",
    category: "control",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACPklEQVR4nO2UXUhTYRjHX92HFbVsCiEVRQRdRXkRRDEWow+CpYN9gINFM9kkGWReRHWVF9F1t3XhTUFFBd3sqoQyI5RDKpZaucDJ3JwSfrSpc//+5x101YfM40ZwePlz3ueD8/ye533PERDlXWUurwP8bwCrOQFwc6vzBkoO8PVLExbnawlwCOlkJZr89zSBWHNiakLtfjO1R04hGDxTOoDY2EUgY8D4ZzNePK+QIKl4FQIX7q8bYk1Jc5OF7oXYBIM4Dn+jU07B73NuPMDYQBgr00YWNDO7BkbhxbkTDbQ5EcWCcGvXuiD+mZAcZPc/tsqOT9v2Yru4jEvuU7St0udyujcOYESJIDVYCSxskcU6rx3A/tqruBKyAytm+kwYfmlBJPKwaIi/BhN9RmQnWHzaBPAf8KirjuO34VW0BstzBMtXS3+j06M9wGh/O9KKAZixADEeQ0pg/qMZT+/uApZpL6jaJu/GULQa7R0PioL4Y2DqjUAuxuL83DDKYmmBxJBAT5T7GWqRWqLyVvl0n/dqBzDyvgPpXo54kpfvE4uMU1NqdhVlw+vHu4Hv9GVVCOatmqA8sxY1hd864907kenjy2MVhe6/UUmBfXU7YD/8BLMfjkogGYtTCR5VQsBhb9YK4CBmuwUyPQLZXoElCgNCTiPfzyePIveuEMu+pa1QwwL1R4LaAKjr5vXbOOsIwd0QgsfVKuX3tiDga4bXFf7l83Af8LXAcbINx+x3tAMo1dIBdAAdQAfQAcoO8BMV11Kp2AIuugAAAABJRU5ErkJggg==",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Comment (not implemented)\n`;
    }
  },
  {
    id: "ext_control_999_6",
    name: "-----------------",
    description: "----------------- action",
    category: "control",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAATUlEQVR4nO3WzQkAIAyD0Qzf2bpWRQfwBwwifA255fCOlaRytjSPxshwEXEGyMyrBQAAAAAAAAAAAPAXoI8d3QY8fctXA3cAAADwHNAA1Q8YAMbbG0AAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: ----------------- (not implemented)\n`;
    }
  },
  {
    id: "ext_control_999_7",
    name: "Variables",
    description: "Variables action",
    category: "control",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAATUlEQVR4nO3WzQkAIAyD0Qzf2bpWRQfwBwwifA255fCOlaRytjSPxshwEXEGyMyrBQAAAAAAAAAAAPAXoI8d3QY8fctXA3cAAADwHNAA1Q8YAMbbG0AAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Variables (not implemented)\n`;
    }
  },
  {
    id: "ext_control_611",
    name: "Set Variable",
    description: "Set variable @0 to @1",
    category: "control",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAeklEQVR4nO3WYQqAIAwF4Hd0f3SwXWUnMeyXSFaDzRU95YHKoA9GIgDUyFRczzaqqrqnlGIDiIhrCCDgmwBgOzKu+/3srD9fDjirdwVY18sB4S0YPzSrcfkLLL12b8ErAP++iAggIA3QiiPyGJD6LL8riJ4EEEBAOmAHGc9go5/87NcAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Set Variable (not implemented)\n`;
    }
  },
  {
    id: "ext_control_612",
    name: "Test Variable",
    description: "If @0 is @N@2 @1",
    category: "control",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAApklEQVR4nO2WSwrAIAxEc+Kue4AeyXXv4rqHsB+6CGJoE6dGqIYBFXEeBjWUqBxHSxpJ+zyFaB5jeq15Ws0QonkIm0pWCIh5DQTM3AoBNbdAwM21EH0BEC2X8j4fS3N8vjlAaT0UQNtvDvB5CnIjaQ3kFmhyDU9BFwD/fohcAG4Kv8+IHYXfd4yCqCpIaiEgJRmHODfUCFaUcgi3srxlDIABMADcAXbIOk3/mucLIQAAAABJRU5ErkJggg==",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Test Variable (not implemented)\n`;
    }
  },
  {
    id: "ext_control_613",
    name: "Draw Variable",
    description: "Draw the value of variable @0",
    category: "control",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAfElEQVR4nGNgYGD4T0v8nwE/ZAAr+v+a6njVqjzSHPD19WGq4lEHjDpgaDqAgaEFjNHZyHxcYsjidHcANvVUdQCpbLo7gOZRgG4RLjVUyQWkxDXVo2BQOGBkF0SjDhh1wIA5AKSYFphoBwxos5yQAlrDUQeMOmDUAQPuAADHnPKvKTf9NgAAAABJRU5ErkJggg==",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Draw Variable (not implemented)\n`;
    }
  },
  {
    id: "ext_score_999_1",
    name: "Score",
    description: "Score action",
    category: "score",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAATUlEQVR4nO3WzQkAIAyD0Qzf2bpWRQfwBwwifA255fCOlaRytjSPxshwEXEGyMyrBQAAAAAAAAAAAPAXoI8d3QY8fctXA3cAAADwHNAA1Q8YAMbbG0AAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Score (not implemented)\n`;
    }
  },
  {
    id: "ext_score_701",
    name: "Set Score",
    description: "Set the score @rto @0",
    category: "score",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABc0lEQVR4nGNgYGD4T0v8nwE/BIH/Dx8+pDpuaGggzQEHDhygKqbIAZs3e/zfvEnm/8rVkv9XrYmirwMO7nf8f/tG4v/Hj7z+X7ki8X/zVk6gQ9zo44DNmz3/372V+B8EPr7P/P/shdj/y9eY/0+dzvl/3foCDEvwhRRZDti0WfH/82deYMvfvvECO+DRM+b/c+ex/Z82XRnFAkIhRZYDVq2R+n/rtvj/9Ru4wHjdeqb/D58w/29tZ/0/ZboWks8JhxRZDti4Oen/jl28/2/fYwb7HITnL2T6X1TE9X/jxha4A4gJKbIT4YqVDv+nzeD8v2Ah8/+OLub/2Tkc/xcuikEJfmJCiqJsuHJ16v8Jk7X+T5ykBzS8FiPxERNSNC+ICIUU1RyAL6vhCymqOICSQoliB5BaKFHdAaQUSjRxALGFEs0cQGyhRDMHEFso0dQBxBRKNHcAuXhoOQCkmBaYaAcMaLOckAJaw1EHjDpg1AED7gAAoIaLVGnySc8AAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Set Score (not implemented)\n`;
    }
  },
  {
    id: "ext_score_702",
    name: "Test Score",
    description: "If score is @N@1 @0",
    category: "score",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABmUlEQVR4nO3WQS/DYBwG8GUVkk7iRhxwcnHk4iPIJI64chOy4MLBVSwOIrIRiaGh20qozSQiwYewkHQh6UhJEPEJHmuDrLq2b/u2dmnf/K99fn2y/tcQQrVP5YKTMbuP3TENl2UQz3zsyjXCNLxQeHU0bhGehNMgaoaL4gjyuU5khQ7w6ZivCEP49eUApLsxPJajKBbbcXrGVhDDviH+PPko7qVxqNfnxwSUl1bc3DJIrEeQycYNQVZNkSJ0gFy+G8/KoBb+/hbVAGWFQWq7CYlkjy7ArilXAOGgC1KpDeIJq82xGIb8xGBxqRFrib6qJ7dvyhXg8GgO5xctKD0w2pOrs8OFMTPbDEHgfgEkTbkCqLPPDyG5EcEuxyC+3IDJKRZbqWld/SRNuQaos8cvYGW1tzL9SGc2DT8+kqaoACRj15RnAKtXzaopTwA0S4ka4HQpeQ5wspR8AZAuJWrAt8KAIF1K1H9GVVUYECRLiSZcBzBD2C0lmnADwAzh5WtnC/hBqDd0Mp59lFYj6vZZ/p8nAASAAFB3wBe89nSeK3xtPQAAAABJRU5ErkJggg==",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Test Score (not implemented)\n`;
    }
  },
  {
    id: "ext_score_703",
    name: "Draw Score",
    description: "Draw the value of score",
    category: "score",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABcklEQVR4nO3WPUvDQBwG8KNRpAFX33ARNx38DJ3EfAVxKA7iEhC6uxXFD2Clatq1g6mgBmtBjFSqFBGsIgYUq0Shijg4P5IMYikkl8tdi5Ac/+3gfveQPIQQQiByQLwXcTehyX0KBTUY4Lt5ynVCASrmDA72RqHrwzCPZzsLOD9LwLpL4rmhoF4fwr4RR7k03RlAxVTwaCXhPF+fi7DfBnB9K2E9I6NWXWo7xCspJoBhjOHVVtzDP94VF9CwJWxrfdC08ZYD/JJiAhR3R3BvDUIvyu7s6DE8vUhIr/RCy03+ubl/UkyAWnUeR+V+WA+Se3NntHwMqZSMm8v0L4AmKeaX8NBIILMhI5eXsLrWA1WNo2TMtcRPk1S4z/BkAdnsBLY2p3B1sdz28tEkJbyI/JLiBvD61LyS4gIIU0qhAUFLiTsgSCkJAdCWkjAAbSkJA9CWklAATSkJB7DO/wI4m0UMNaCrv+V+G0SvCBABIkDXAT8pswgGD/FLkAAAAABJRU5ErkJggg==",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Draw Score (not implemented)\n`;
    }
  },
  {
    id: "ext_score_709",
    name: "Show Highscore",
    description: "Show the highscore table",
    category: "score",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAA/ElEQVR4nGNgYGD4T0v8nwE/BIH/Dx8+pDpuaGggzQEHDhygKqbIARs27v/PYDBn4ByQm7sCwwHd3ZuJwlRxAAijO6C0atn/FUce/t987dP//bc//T/y8Mf/C89//L/29sf/xx/+/v/04x/tHUAI09QBdE0DA5oLjI2ngn0PwhMmbhm4EFi3fh9KNNA1F+zddxhseVPzevrngo7OjWDL5y/YOTC5ABb/MDzycgGy7+fO2zFwITBv/s6BywU1tWvBlk+atI3+uQCGt2w9gBICdMsFdnYz4Glg3vwBTAMDlgsGxAEgxbTARDtgQJvlhBTQGo46YNQBow4YcAcAAGQHqLLXvYQ6AAAAAElFTkSuQmCC",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Show Highscore (not implemented)\n`;
    }
  },
  {
    id: "ext_score_707",
    name: "Clear Highscore",
    description: "Clear the highscore table",
    category: "score",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACtklEQVR4nO2WX0hTURzHL6YkFEGB+lYEvWjmv2WQmkkmLWdURBrR5BaCqWzrwYFGw9FMXUMtcExr6Rjb2pi4iZvbgm2mYlAPaebEpGL04FMQg2Av9W33BCOxnLUjI9g9fF/O/XF/H36/7++cyzAMg+0UmM0X9yAYDFKXXC7/O4CpqSmqigvAPu4HU6BNHIBIZN4AoFJNbElUAN7vLoIzvQwOkwV+v5/sSW+bYJ4NYiIQgn81hNlgGPNrYQQ+h/HpyzeEwt/pAaxkluAjkw33gVLodDoCwQHEEjUAT78GztQCAmEoPgur1frbPs+zrSTGMfgEPp+Pnge8Xi+GVH2Y28sjCYYFV2G326Pvpx0uLBecx+quQgxdYtHY2Aij0bgO4p8BeDw1MSCTPwjZrT682HeUQAyxLXA6nZjTGvAuqxSL+ysgr62HUChEd3c33G43vQpwGrP5IhCPoB/QEIil1Fzoiy5jJb0Qzw6ewcXKK+DzhWhuVqKz00p3Cry+GVKFuwobKSsHwQFwlXAdqkJdgxgSeS/Gnr/GwlqI7hT0KMdJ8hGdJ7r3hn+dJH+7IweLKdmoy+ej4WZfxPlG+lNA+v+LFvk3SHJndiWqy05iZk8+ltIOY0Qqg8fj2dA6ah7gFE2ecxoCgQBisRjqnvvEE4G03E0h4q6ALOMaSf4q41jEbHxIJBJYLJaoJ2JBxFWBl50PSfKFlCOoLa0Ay7Joa3scdboy4pP2ll7YM4+TOG2JEAqFmd4UjJ5oIh9WZ/FQU1MDjUaD1nbDurtg+sNXMgXGahbLO/MwrDehq2uUDoDL5cId2T0wGZWQSqVwOBx/OP+NaBIN4NwFEU5V1aOjwxA/QHn54E8f5KnR/+ApJicnY9793Clos9noT0E8+r8AuODt0JYBEvpbHitgu1cSIAmQBEg4wA80kFGFQBx7lAAAAABJRU5ErkJggg==",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Clear Highscore (not implemented)\n`;
    }
  },
  {
    id: "ext_score_999_2",
    name: "------------",
    description: "------------ action",
    category: "score",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAATUlEQVR4nO3WzQkAIAyD0Qzf2bpWRQfwBwwifA255fCOlaRytjSPxshwEXEGyMyrBQAAAAAAAAAAAPAXoI8d3QY8fctXA3cAAADwHNAA1Q8YAMbbG0AAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: ------------ (not implemented)\n`;
    }
  },
  {
    id: "ext_score_999_3",
    name: "Lives",
    description: "Lives action",
    category: "score",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAATUlEQVR4nO3WzQkAIAyD0Qzf2bpWRQfwBwwifA255fCOlaRytjSPxshwEXEGyMyrBQAAAAAAAAAAAPAXoI8d3QY8fctXA3cAAADwHNAA1Q8YAMbbG0AAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Lives (not implemented)\n`;
    }
  },
  {
    id: "ext_score_711",
    name: "Set Lives",
    description: "Set lives @rto @0",
    category: "score",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACMUlEQVR4nO2WX0hTURzHr0JpUIgQERJRD66cRYM7dVPnTOc0p+UyDW0up1k2dZFUD0W1IqIMDF+CkiYsWSTEohlBke2tegh6iIgIYi/10h/21sPg0z134FN/2b2OYPfw5ZzLOfD93Pv7nfM7kiRJ6Cmk3zfxkEgkNFcwGPw3gHg8rqlyABkDPI/d48XMDVVi/Ku5Z08eaw/w5uQIH8e9JIea+eZz8M7TtAghevGelAtJWov41LOdyNkzRO9GWXi6kDmAMEheCMDtKTjdB4cd0G/hq7NMnRM9luVQtQz2KONeEx86rExOXCUWm88c4O3lUxCdhkd34NwAjDhhoAZ6tqXNHWugegXIeeBcC0N2vlcU4PUcIhKZ0wjgfgjmwxDsh0CraoJHBrcBmkvAtgrM+WAtAF81KTkfh8vDzZlbmQO8vD5F6uIwPFAAJsbgiAuGG8BbCV1GcK2H+uJ0CIT2buFzRTENrb1Mh8LaJKFIstTcNQhfgWNu8DcpX2pVzLZC+0ZoXK2EoVD5C3kqRMBoonO3T9tt+NrfBQ9n4ZIfxlpgsFZNODpK07G3rVQBjm8qo6bOrc9B9GpcyYHZSTi6Ew7WQ58ZOjfDjnVgL8JvKMdi26XvSahCnB9U8qAR9ldBdzm0beCEUTGv/bm55kfxl9F2GG1Z3I4hkwGztW1pa4EKcaCO9/ZSKmVHdoqRMN8n25amGGWqHMD/BSAW66G/BsjqtfxPC/RuOYAcQA4g6wA/AItdixU8J7/PAAAAAElFTkSuQmCC",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Set Lives (not implemented)\n`;
    }
  },
  {
    id: "ext_score_712",
    name: "Test Lives",
    description: "If lives are @N@1 @0",
    category: "score",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACbElEQVR4nO2WW0hUQRjHVSgNChEiIiLqwS3XooVddVddNV1X81JuZqGtm5csXXUjqYigKxFhofTSSyAhlheQTLeWpCtREfRQtAVdoHyph27sWw/CrzlHjIV2aXfPkC+e4c8MZzjz/52Zb+abOOJCF/EQjcKN868S1nxqioh1xHMvZoiw5l7v16gUK4QUcy0Q0sxjhZBqHgtEWPO73pc8ujqmSmkH993xvubh4G1Vk773miBCArw52s7nLheBlhJ+Ntrwt7m4P/Fc7VPqd85iAsYkApZkvtRu4tqJ44zf8HPL90k7gGIQOOOBwYtwrB7abNBg5oc9jQcTT9Ua80LIWgDbRbvOwMcqCz3dveL7t9oBXvVegOuXYXIYTjVBux2acqB244y5bRlkLwJjPNiXQ0s+vzIScTn3MTr6TBLAeJ940Q8nG8BTpprgNIJDByUrwLoETAlgSYTGbKaNCdjKnQwNP9YO8OTKCNNnW+GmAOjuhP3l0FoIrkyo0UP5KihImVkCRTvX8y0jhcKyOgaHJAAoUoJseuQS9J+Hgw5wF4s/tQizDVC5BoqWimVIErMQr0J49AaqtzXK2wWK/O4a8A3AOTd0lkJzrhpwVKXOrL11sQpwaG0aOXkOudtwVi+6RAwM9MCBLbC3AOpNUL0ONq+E/GTcunTM1q3yz4G/IE43izgogt1ZsCMdKlZzWC/Mc0ObSwVQ9L2jEjpK/2zHPoMOk6VCynEccR5QIfbk8SE/lUyjTVo+mKWICEIx32W0yk1GQVMxd+lYFoSmC4lWCClXsmAIZcBoJO1SGgwxZ9fy/1nmAeYB5gHmHOA3upF2PUH1XH0AAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Test Lives (not implemented)\n`;
    }
  },
  {
    id: "ext_score_713",
    name: "Draw Lives",
    description: "Draw the number of lives",
    category: "score",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACPUlEQVR4nO2WXUhTYRjHj0JpUIgQERFRF66cRYMzdVPnTI/TnJbLTLS5nGbZ1EVSXRR9ElEGRjfdCF6IGO4miCRJiz5uvegiTWWh9KGFlewi6GLw67xnEATRBztzBOPlz3te3gf+v3Oe532fI0mSRCyF9PshaUEs6q5AwP9vAF8Xn+uqBEDUAG8nxpgeHWJyeJCPwcc/7Ym12BNaeP1Uf4DJM+3Md3kItZax5FWYcZfy/tWYtidmsQ7JqYSsaSzU72LwwnneqVBL88+iBwiOjxC64oc7t+BcIxxToMnCF0emZi5mLCshdwXsV58bTMxWW+npvsmHuSfRA0xdPwt3e+HhEFxqhnYHNOdD/c6IubIO8laBnASO9dBq51t2Ch73Ud7MPNIJ4F4f3O+Hi03gr9BMcMvgMkDZBrCtAXMyWFPAm0dYTkZxupmbHo0eYCLQS/hqGwyrAN2dcNwJbcXgyYFaIzg3QVF6JAVCddv5lJ1OcUUDs1M6AAiJIgsHbkP/DTjpAl+p+qZW1WwHVG2BkrVqGlLVr5CkQfiNJmr2efU9hi99tfBgAK75oLMcWgq0gqM6I5J722oN4NTWTPILXbG5iF50qTUw0AMn9sCRImg0Q8022L0R7Gn4DFlYbHtjexNqEJdb1DoogUO5cCALKjdz2qiaF/zaXPer+HNHFXSU/ziOfSYDZmvl8vYCDeJwIUF7BjmyEp9mJMwPyrblaUbRKgHwfwGI4FjorwHi+lv+p4BYjwRAAiABEHeA74JRC4AsHMF7AAAAAElFTkSuQmCC",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Draw Lives (not implemented)\n`;
    }
  },
  {
    id: "ext_score_714",
    name: "Draw Life Images",
    description: "Draw the lives as image",
    category: "score",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABRUlEQVR4nGNgYGD4T0v8nwE/ZAAr+v+a6njVqjzSHPD19WGq4lEHkOWAN6dX/b/TVf3/ZmPB/5dXt/+/uaj///10v/+XZ3b8v3hmF9xwYtSR5YCnc3r+/59R//9/msP/t4ku/3/bC///b8///5u/xv/urglwBxCjjiwHvJjR/P/f/Pb//7Pd/v+P1P//30Xs/38zlv8vnWT/V9c1wx1AjDqyHPDp1pb/b+YBDa6J+f8/zuz/f2+5/y/MeP43Bvj8f3RzB9wBxKgjOxF+frj7/7v+wv//U+z+v/FW+18bFvL/+d1dGImMkDrKcsHzff8/1ET9n5sY9v/d0324UzsedUMzGw5KBxBbNtDMAcSWDTRzALFlA80cQGzZQNNESGzZQNtcQGzZMOyy4chwAEgxLTDRDhjQZjkhBbSGow4YdcCoAwbcAQC/xTMmXAuJLAAAAABJRU5ErkJggg==",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Draw Life Images (not implemented)\n`;
    }
  },
  {
    id: "ext_score_999_4",
    name: "------------",
    description: "------------ action",
    category: "score",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAATUlEQVR4nO3WzQkAIAyD0Qzf2bpWRQfwBwwifA255fCOlaRytjSPxshwEXEGyMyrBQAAAAAAAAAAAPAXoI8d3QY8fctXA3cAAADwHNAA1Q8YAMbbG0AAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: ------------ (not implemented)\n`;
    }
  },
  {
    id: "ext_score_999_5",
    name: "Health",
    description: "Health action",
    category: "score",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAATUlEQVR4nO3WzQkAIAyD0Qzf2bpWRQfwBwwifA255fCOlaRytjSPxshwEXEGyMyrBQAAAAAAAAAAAPAXoI8d3QY8fctXA3cAAADwHNAA1Q8YAMbbG0AAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Health (not implemented)\n`;
    }
  },
  {
    id: "ext_score_721",
    name: "Set Health",
    description: "Set the health @rto @0",
    category: "score",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAA6ElEQVR4nGNgYGD4T0v8nwE/BIH/Dx8+pDpuaGggzQEHDhygKh51wKgDRh1AlgNUisxJxosEBFAwRQ5gSGP43/I86n/9w4j/1XfC/pff9P1ffMXnf/55bzBOO+HwP+Wow//4fQ7/Y3Y7gB3wvqAAjkEOaGlpocwBnW9jEI645wd3BAhnn3cAOyLpkOP/uL0QB7xJSoJjqjig73McwhGP/eGOAOH8Kw7/M89AHJF4cAAdAMKgqKCJA0jF6ImQIgeAMMgASvHQLQdGHTDqgAFzAEgxLTDRDhjQZjkhBbSGow4YdcCoAwbcAQAzbW6J5y3LsQAAAABJRU5ErkJggg==",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Set Health (not implemented)\n`;
    }
  },
  {
    id: "ext_score_722",
    name: "Test Health",
    description: "If health is @N@1 @0",
    category: "score",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABFUlEQVR4nGP4z4AdAsF/UjAucwhBnJY/fPifaFyRt49sR+C0fMuW1yRhch1BFcspcQTVLCfXEVS1nBxHUN1yUh0x6gAUB6gUmZOMFwkIoGCKHMCQxvC/5XnU//qHEf+r74T9L7/p+7/4is///PPeYJx2wuF/ylGH//H7HP7H7HYAO+B9QQEcgxzQ03SCMgd0vo1BOOKeH9wRIJx93gHsiKRDjv/j9kIc8CYpCY6p4oC+z3EIRzz2hzsChPOvOPzPPANxROLBAXQACIOigiYOIBWjJ0KKHADCIAMoxUO3HBgQB0BdMXCVEVJQDFx1TC1HUNQgodQRVGmSITsCZCApmGqNUmRHDFiznJ5w1AGjDhh1wIA7AADiJF79yPMUzwAAAABJRU5ErkJggg==",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Test Health (not implemented)\n`;
    }
  },
  {
    id: "ext_score_723",
    name: "Draw Health",
    description: "Draw the health bar",
    category: "score",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAA6ElEQVR4nGNgYGD4T0v8nwE/ZAAr+v+a6njVqjzSHPD19WGq4lEHjDpg1AFkOUClyJxkvEhAAAVT5ACGNIb/Lc+j/tc/jPhffSfsf/lN3//FV3z+55/3BuO0Ew7/U446/I/f5/A/ZrcD2AHvCwrgGOSALVsqKHNA59sYhCPu+cEdAcLZ5x3Ajkg65Pg/bi/EAW+SkuCYKg7o+xyHcMRjf7gjQDj/isP/zDMQRyQeHEAHgDAoKmjiAFIxeiKkyAEgDDKAUjx0y4FRB4w6YMAcAFJMC0y0Awa0WU5IAa3hqANGHTDqgAF3AAAWB/bJc//dCwAAAABJRU5ErkJggg==",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Draw Health (not implemented)\n`;
    }
  },
  {
    id: "ext_score_731",
    name: "Score Caption",
    description: "Set the score caption info",
    category: "score",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAA20lEQVR4nO2WUQvCIBDH/a59Eb9XEO6xlz1HREx6sT1VBD7aju2YyLYWeXcUnvwVnfD/eepQKaUCpYJaLhDBWptdWuvPAIwxWfW7AGpTf6VsABhxPzXDsfhbFoAlMxaAKcM5gDRTWc+A6BZMZWDuXJBlQOwWrA0/6NpVh1vgBUBz11XHewh7xwgQm7MD+Kh1Q+oBYHtmAPCRmue48urCAJCm/fTozUG7hhgAzVvfC8zrtldliQHiVcN+ozGaoqD/Hz8i8QeJCABMptBqANFn+bsJ1KUAFIACIA7wAozixzXOlwO7AAAAAElFTkSuQmCC",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Score Caption (not implemented)\n`;
    }
  },
  {
    id: "ext_extra_999_1",
    name: "Particles",
    description: "Particles action",
    category: "extra",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAATUlEQVR4nO3WzQkAIAyD0Qzf2bpWRQfwBwwifA255fCOlaRytjSPxshwEXEGyMyrBQAAAAAAAAAAAPAXoI8d3QY8fctXA3cAAADwHNAA1Q8YAMbbG0AAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Particles (not implemented)\n`;
    }
  },
  {
    id: "ext_extra_820",
    name: "Part_Syst_Create",
    description: "Part_Syst_Create action",
    category: "extra",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACY0lEQVR4nO2WS2gTURiFB0QXguCiG7cK6qouRHAjtBvFjejChQshVLG6LxQfJHQsrRURYkWkqW1d1PRBm0npY5rXTMQ2WWhtoaaopOPC+kCtK1sLdY5zrkRKSZqG3jSbZPgJTO7kfOeec0MURVFQzIGy8cUXLMuSPh6PpzAAwzCyzngkAW10GtGomXNNtpEGoIcS6B+aKQ1ALGagP/gS3o45jIcnth+A7h8+TcPt/Qh/YLagXdgyAN33BKZQc+s7Tl9bQkPrPMZCk8UHoDCd92pTqL/3GZXnV3H4rC0gvJ1paMMJhKMvxDqpAGy7KJyTObf9kuOc4ruO2dhx1EZFlY2Ttcu4fv8TOntT0EaS4plILHs3CgbgUWPbWTjPgwXhmM4prhyxsfeEjeMXV+G6+RN3Hs+jw4EYGJ7GaCgpByBmmKJkbDsLpzqZE6Ki6o8QP3RmBZfdP9DaNee4f4VwJC7W54piSyXkF+tO4Zj5qatLwjnF/YOvEQrH8+Yv7RgyZ2buurEonFM885lpmmKsNw34MHMByee+//ekAUSctnf1pdDsZM5tX+ucQvjdByy3wV6sxK+3ezA2UCcXILMLT3pSIvO19xfe1QvxDMCKtRvv9YMIaAG5ADyabPv6X8Gvs9VCWMy3nWIH0voB+Hw+uQCMgUdtffEm421ClM75/mViH0x/NbqfdcsFyDXMmpnTdVrfL8RVVYUZl9yBjQA4jY/a0Tg4AvX2P3HpJcwH4Kpz49yVWrTcbZF/DDcDoAU1NDU3ITgU3F6AfFMQABcXYzYNUNK/5fkWFPsqA5QBygAlB/gLT72+K++LScsAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Part_Syst_Create (not implemented)\n`;
    }
  },
  {
    id: "ext_extra_821",
    name: "Part_Syst_Destroy",
    description: "Part_Syst_Destroy action",
    category: "extra",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAC9klEQVR4nO2Wy08TYRTFm5i4dsEfwE434oKYGA0JG18b48aV0RA1Ed24IqI0VCHQ+oimtAmvFDChhbYBWlrK9DXTFqFYtCBUSCEFJdCSgBZYQBpLj3O/iAsDKmFGNszkLCa5M/d37z33axUKhQJyCoo/33Rhbm5OcqlUqr0BCIKwo9y+MGyuMfj9gV1jdpJkAJwnDGvvx4MB4HkBVvt7aFum4PYO/n8Aql7/JoFK7QI6emJ76sK+Aaj6zp4obilXcPneBp7qZtHvGZIfgBJT5WZbFA9fplBwLYsTV3MMQtuagM0Zhtf/lsVJCkBuZ4YTZ05tvy1WTsmPns7hSGEOecU5XLi7iUevkmg1T8LWN8ze8fE7e2PPALRq5HYynKpukVVMlVNyxakcjhXlcOZGFiUVaWgaZtEiQnQ5x+DyDEsDwAsBZjJyOxmuSpw5QeQVb7Hkx69kcKfyK3RtU2L1H+D1BVn8bqPYlwnpw5xoOJr5xdINVjkl7+geRSAQ+CVBFCcMwhqMoT60DMPwGkw2TnzfL80a0pxp5iWPv7HKPd4g3JEpOEdT6Il8hs4TR7V7EUrvOjQDm+AWtqCu08PhdEgD4BPd3maZhFqcObWd2j2a3sQswBTP5hBOZ+BdSsGeimA6k4FKrYbdbpfuKKYuGDon2czpOTS/jpE1MEVWM3gRa0KRoxhn7ecwNL8CZXUNHA6JOiD8PA3J7dunYFfkCyxxMPUmlvF8XIfSgfso7C6E+d0nVFTVwNXvkg6AxkCrtu32ruAEtOHvaIxm0RlP4nzfJVznb+L1hB76fjee1NSKXvFIB/C77P4w6kdW4VncgnE6iXxTPk5aC1A1poHJH4L6mUaE5eUDEIIhRJNL4FOAeSYNY2IA0+sZ+MZjeFBWBoPBwFZUPgC2+zyMnA/Ntj7oTRYoa9UoKy+HTqcDx3HyAtDHqcVmixlNzU1oaGxAu7GdOZ8XwbYPKfk6IMfPMQXLoX8GONC/5X8LkPs+BDgEOAQ4cIAfCyPBh+UpAeoAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Part_Syst_Destroy (not implemented)\n`;
    }
  },
  {
    id: "ext_extra_822",
    name: "Part_Syst_Clear",
    description: "Part_Syst_Clear action",
    category: "extra",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAChElEQVR4nO2WS2gTYRSFB4S6caGSldK1rnxEUkSpFtSKGxFsEUWlan0t1KU0KQ2NC0VFiHXhwjZ1EdoaTNOYvvKaqSamtSZGqFPUJhGsUbDahRAR6hz/+0MkQlIdOmM2yXBgCDdzv3vP+YcIgiBAT0FY/KIPMpmM5rJareoARFEsqtFgDJ6hJEIhqWRNMWkGMOKPweV9WR6AcFiEa+A57F3TGA1E/z8ATX/nfgpt9ln09E+p2sKSAWj63v4ETrbOYd/5HNo70hj2P9UfgBrT5H2eBC7f/IgNjQtYf0DhEHZHCh5fDIFQhNdpCkBp54FjntPaT7HJqXmVScGyLQoMdQrqz35Hy60sHH0yPIPj/DfBcPFsqAago0Zpp8BZb3/gE9Pk1FzYqGBlrYKtxxbQZJnHtbtpdDGIh74khvzj2gCERYmHjNJOgbMxzwnCUPeTN1+3/wea276go3uaTR9HIDjG60tZsaQQ0oNHWODI873ncnxyai7faEH0kRuSJC0qzY4h+UyeN5m/8slzO1fh8xETngz7ijaODA5oCxBkae9+IOMq85zWPum8h2/1azB3yPgHBN2nzCf4hjQFyG+hs1fmntPDn/U4ML9nLbKHaxDxurk+Hd+O17YLkEIh7QHoaFLaKRf5iSfYJt7XGvCuYROyTG9am/XJQN4GOmqU9sImLyynMWusQqZhMx573foBFIr7zZrFbZcws201kgzi7a5qTB3dgbGCTOgGEHV2Ir27Gmnjcg6Rbxhvvwi50fQbQjeAyetmzNSs4A3zgeNi9/TdK7YJskM3gIjLiQn7lZIvoITlDOSDRv0A1EgVABXroX8GKOvf8r8V6H1VACoAFYCyA/wCKRCv9sOf5d0AAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Part_Syst_Clear (not implemented)\n`;
    }
  },
  {
    id: "ext_extra_825",
    name: "Part_Type_Create_Old",
    description: "Part_Type_Create_Old action",
    category: "extra",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACCUlEQVR4nO2WOUsDURSFB4IWgmChha2CWqW2tTFYWtoFFf0DQrCJyShG7QSxMG6NxjXOCJKxU8G4oIJbcCGJAVfcKjfUOb77xELNqJFZmmS4BF4enO/ce24YQRAEGFkQfn7og0QioXt5PJ7UAODIS1pLs7PYkmXN37VKPwBFwfbEhHUAa+Pj2OvsxCLrhOkA5D7a1YVjtxs7gYD5ABsjI7iqrsZ9RQViXi/CoZA5AOR8Y3QUZy4XXux2qCUlHCLKRrHyx0CmDEBpJ2GaObX9qqbmXTwzE6rNBjU3Fw/l5ThtbERkYACrDGTph1ykDECrRmmnwJ00NXHH5JyLsztqTg5eSktx63Qi1taGSH8/toJBrGqM5d8joLRT4GKiyCFemXMSfy4uxnVtLfZZd9YlyfgQhmkDWDfuHQ7unMQ3WShN3QKaM838hrWdnCe7E9/14mizCssLfmP+iCKDg4j5fMnb/jgGPPRAvbHjbj8bockG/QGoC5G+vm/nJwcuLv4B8BTPwqFShClpSl8AWk1K+9fzi50yLszrMoN3IKoUwu/36wvAu5Bk1cLzPVyUnNP3+WI+5gJlGBoe0h9Aq2jm5DqqFHBxka2u7hn4rVq6e9ESnIHYLH46Nw3A2eBGZV092jvarQGQZAmtvlbI07I1AFqVEgBdNqL+DGDpa/lvF4x+0gBpgDSA5QBvlynGdQG14SMAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Part_Type_Create_Old (not implemented)\n`;
    }
  },
  {
    id: "ext_extra_823",
    name: "Part_Type_Create",
    description: "Part_Type_Create action",
    category: "extra",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACRUlEQVR4nO2Wv0tbcRTFH0gdCoKDS1cL1Smzq4vi6NgtqNh/QAguMUnFqJsgHYy/Fo1WG98rlDxR9CWatJUqaG2oLYkGaqto7VRtqX2n3/O1pSUYm+A3Zkkelwy5eedzzr3fl2iapqGQBe3qiy+k02nl5fF48gOwLOvSej4/jy3DQHRpKWvPZaUOwDTxena2OACR5WW8mpnB24EBxEQSNw5A98nBQXxwu7EdDOaVwrUB6H5jagrHLS04bWpCyutFPBwuPACF6XxjehqfXC6cOxywa2slRFKM4qVYyNWFBdmnFIDbTmHOnLEft7ZeiJeXwy4rg11VhbOGBnzs7ERibAxrAoTfiS0uqgHgUeO2c+H2u7qkYzqX4qLHrqzEeV0dvjidSPX2IjE6iq1QCGtZxpI3QFREyiXjtnPhUj6fhPgpnFP8R00NPre1YUeks67rWBHO2Z9tFNdaQt44zhMg0jhtbJTOKb4plnIlh/krO4acM2d+ImKnc4pn9uy+8WJv8z5eRAPqAVZFzInxcaT8fhl7pnN8ewycDcE+ceDrTgXCTzoUPwl/p5AYGZEz//ez/XcuKf4H4Pvubbw372FOn1P/W8Btz3wKHm7XS2FZR7dkAknzLgKBgFoAjoFHLTP+eGRIitI53w9id2AF6zExOaEW4KrizOk6aVZLcZ84ulZE4Q7kUt2PhtEdegbfw7/iNwrg7HCjuf0B+vr71B/DXEo3dPT4e2A8NYoDkK3yAmBzISpngKL+Lf9fQ6GvEkAJoARQdIBfYbW9LO9ohloAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Part_Type_Create (not implemented)\n`;
    }
  },
  {
    id: "ext_extra_824",
    name: "Part_Type_Color",
    description: "Part_Type_Color action",
    category: "extra",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAB3ElEQVR4nO2WzUsCURTFJwJ3QYu2tdWVi1YFrY3+C6n+B2lT1ia3glurnUYStUpR1LSMooQspBYNCX0QWNHGoI85vTMVhONUg2/GjQ5n5dXzu/ee9xhFURTYKSi/P/ygVqtJVzAYtAaQz+dbai+VQmVzE4Vs1rSmleQBJJM4SSQ6A7Cdy+FwbQ1n4TB2xSQcB2D3F5EIrmZncRqLWZpC2wDsvhyPoz45icbEBNT5eZS2tuwHoDE7L6+u4jYQwJvXC83j0SEuxCr2RSB30mm9TioA005j7pxjr09NfZq7XNB6e6ENDODZ58PNzAyqy8s4ECD8zW4mIweAR41pZ+Cu5+b0jtm5bi5qtP5+vI2M4NHvhxoKobq0hMr6Og5M1mIZoCBGypAx7QycurCgQ7yLzmn+6nbjfnoa52I6RxsbKIrOWW+2irZCyD8u8QSIaTTGx/XOaX4sQln8x/6lHUPumTt/EGNn5zR39B7YEWOurqxAXVzUx/6z89ExxVTybsKvKVSjUX3nP7+jkaYMGSQV4Ps2ZNqbb0Eaoe/JIOkAXAOPWnPwaOTquTNIOoCZaKTkNIMcBRjEsEGOAly+GOUogO3HsB1ZAmCxHfo3QEdfy/8qsPvpAnQBugAdB/gAcl+F/69P3jQAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Part_Type_Color (not implemented)\n`;
    }
  },
  {
    id: "ext_extra_826",
    name: "Part_Type_Life",
    description: "Part_Type_Life action",
    category: "extra",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACWUlEQVR4nO2WS0gbURSGBxTp0oAboQt3ZlEEF9KUUqxdxMa6c2EtLmKSgghdKUhoSWIqJmARlOx80o3axCeCihKjRkultVTLoAUjaX0sqhYXtdLG+b3ntgULiU3IHbPJDGc1Z+Z85z//uYwkSRLUDEiX33QhHA4LD4fDkRhAIBCIGq+np7E2NoYFvz9mTrQQBzA1hXWfLzUA83NzeOv1YqO9HUtMiSsHoO63PB7s2Gz42N+fkApJA1D3qwMDODCZcGIwINTUhOXJSfUBqDB1vjo4iP3GRkQKCqBotRxii43iDTNkcGaG5wkFILdTYZo5yX5gNv8unpUFJSMDSk4Ofuj12LNaIff2YoWB0DtLs7NiAGjVyO1kuF27nXdMnfPiLEfJzkZEp8M3oxEhtxtyTw/WhoexEmMsCQMsMEnJZOR2MlzI6eQQZ6xzKv4rPx+HFgs2mTrvRkexyDqn/FijSMqE9OFl2gCmxklpKe+cin9gplyMY/7C1pDmTDM/YrJT51T8Ss+BIJNZ7utDyOXissfTudiT8I8Kcnc3n/k/cBPjPPjI2LPgyBAD9IsF+HsaktsvnoLrXR34brPguKYE7zs78MVswOkdDT4Zy+B95RMLQGOgVbso/9euVqDzOVB7Dz8rbgB3NcCta4g8yIP1abNYgGix0WaH8vIF8OQ+8KgQ0OcCNzMh376OZzaX+gAcwtMCOM2AUQeU52GzSIO6hybxHrgstt0NwONi7JVpUVtZI34L4onP9dVorapSZw2TiYQAKFmNiBsgpb/l/0tQ+04DpAHSACkHOAfsULM4ODV9eAAAAABJRU5ErkJggg==",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Part_Type_Life (not implemented)\n`;
    }
  },
  {
    id: "ext_extra_827",
    name: "Part_Type_Speed",
    description: "Part_Type_Speed action",
    category: "extra",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACVklEQVR4nO2WzStEYRTGbylrC/+Dj4WdkihFZMVGdhJKSSghKYYNOymy8rERMvlYCBFjzBifI0PXoLka+SgxrFhgHue8I6G5zOS9ZjNzO6t5Z87vPM9z3hlFURQYWVB+fvgFr9crvUwmU3gAFoslaDkWFuCamYF1eVn3TLCSBzA/jwOzOTIAqysr2JmYgLunB3ZS4t8BeHpPby8uWltxODoalgp/BuDpnWNjuC0rw2N+PrT2dqzPzRkPwI15cuf4OK6bmvCSkgJ/YqKA8JAVmxRI2+KiOCcVgNPOjdlzlv22vDzQPDYW/pgY+OPj8ZSbi6vmZqhDQ9giEP6MfWlJDgCvGqedA3fZ1iYm5slFczrjj4vDS1oa7ktLoXV1QR0chGtyEls6toQNYCVJOWScdg6c1tEhIF5pcm7+nJCAu4oKHJM6u9PTWKPJ+byeFX8KIX/xOm8AqfGYlycm5+b7FMq1EPyXtobsM3vuI9l5cr1mtpERYwBsJLM6PAyts1PIrgdwlJ4OR3+/ATfhuwrqwIDw/Pv7G93dsNNGnKamwpuU9AVC6m8Bp10EbnYWVlJir6EBzro6eCorsVdVBY1y4mtsxFlGBjberZIGwDbwqnHwuJmbNuOkpQWuoiKc1dYGAHJy8EBbc091npUFR1+fPIDPtU33wz5dzUfV1QGAmpoAADX11dfjpqQE7sJCoZQhAB+2kNdcxwUFAsCTmYlrUsadnS0skmpBKHWSnAyVIKRvQajlKi6GdWoqcgDBKiwAPmxEhQwQ0b/lvx0w+okCRAGiABEHeAOG4q3ffn9saAAAAABJRU5ErkJggg==",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Part_Type_Speed (not implemented)\n`;
    }
  },
  {
    id: "ext_extra_828",
    name: "Part_Type_Gravity",
    description: "Part_Type_Gravity action",
    category: "extra",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACd0lEQVR4nO2W30tTYRjHDwi76CKEpIvqIiNQKbWbQv0DNEuJuoh+EXOOKLoIEllGzLmLZjeS4U2QPwLJ/fKwo+bZ3JzLmaLoohmjIAcLtRurO7tI9+193rpYusy5cxzBdvjenPOO5/N8n+/7niMIggA1BWHri36IxWKKy2QypQYQCASSasrjQViSMO73/3VNMikH4HZj3unMDMCrsTHMOhx4396O18yJXQeg7hc6OrBoNOJdX19KLqQNQN2HrFas6HRYra5GtKUFk7KsPgAVps5DNhs+GwxYKylBvLCQQyywUUyzQE54vXwdrRcHfLCK3vQBKO1UmGZOtq/U1/8qrtEgnpODeF4evldWYrmpCZHubswwEPrPyat27K91bYJIGYC2GqWdArfU3Mw7ps55cbYmnpuLtbIyfNNqEW1tRaSrC4+fySi+5MRRfQDGtkHuxo4BxpmlFDJKOwUuajZziHXWORX/UVCAL3o9PjB35lwuBH0+nLlpx55zL3GkIYT8mhfodYwoE0ICmaQdwNxYrarinVPxtyyUwYT5k67fl1B0TYI0NKr8NqQ508y/Mtupcyqe+Fz2+PHcNsJHkWi/YgATzOZITw+iFgu3PbFzkuHRAA5ddOPYrSAPo/In4W8XIp2dfOYbnxPA8XtvcPbpMirqRPXeBWFR/OMUJNtP37Ch+HwvC+Acyp98woFaK7/XaJGUBaAxzLATcKP9VEhTM4yDd+dR9PAjDt+ZRellu/IObCXdAxf2XnBjn24Kp7T96E/nHNgJAOm2WcKJKw4MySpsw+1qcHh0071dBUim/wuAFquhbQNk9LP8XwvUvrIAWYAsQMYBfgLOS6bm0gSpHwAAAABJRU5ErkJggg==",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Part_Type_Gravity (not implemented)\n`;
    }
  },
  {
    id: "ext_extra_829",
    name: "Part_Type_Secondary",
    description: "Part_Type_Secondary action",
    category: "extra",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACI0lEQVR4nO2WSy8DcRTFJ5FYW/AFbGolsfMJiE9B8AlqITaUSHQr6dZrhRKPjXeoRwcTJEoaFiZp4rFQ7EioHvf8mURkOlXzr27ayV3Nbe/vnnP+MzUMw0AxC4b3xQ9SqZT2CoVChQHEYjHX2l9dRWJxETubmzl73EofwMoKzmZnSwOwvbWFo5kZXAwPIy5K/DsAt7+KRHDd24vzycmCVPANwO1PpqaQbm/Hc0sL7P5+mMvLxQfgYG5+Mj2Nu+5uZOrrka2rUxBXYsWhBHJvfV31aQVg2jmYnlP2dEfH5/DKSmQrKpCtrsZLUxNue3qQHBuDJSD8TnxjQw8AjxrTzsDd9PWpjbm5Gi492aoqZBob8dTWBjscRnJ0FIm5OVhiy4FUfG3NH8COSMqQMe0MnD0woCDeZXMOfwsE8NDZiUtR53hhAbuyOftpRWJiAsfRqL4Q8odNngBR47m5WW3O4acSyt0f/luiwn1rK66DQZhLS3qPIX2m548iOzfncOceZefmabmXqanBa20tbru61MkxRUVfAI6neyJzcnwc9tCQkv375rxP2bk5h780NMAeHIQlfb4VcDzd/lIhOTKiPP8O5/RSdm7O4Voy8NNTHk2m3XkKugWOslvz8/4A8nlK+XMFznR5TxQM4OVpPjitj2I3T/MFTvvLyM1Tr8BpB8glqxec9tdxrvKC+zMAm4tRvwYo6d/yfA3FvsoAZYAyQMkBPgB6AK//WHMGRAAAAABJRU5ErkJggg==",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Part_Type_Secondary (not implemented)\n`;
    }
  },
  {
    id: "ext_extra_831",
    name: "Part_Emit_Create",
    description: "Part_Emit_Create action",
    category: "extra",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACXElEQVR4nO2WP2gTcRTHD0QHQXDo4qpQnDq7dlEcBHUrOgSVCkK3QBFKQs/SWg1CUQQTE0VoE6P2LrYxF3PJpdLkHLRBqCkqyTlY/2Ctk41CvW/znkRKSZqG/tIsueMRuPuF7+e97/eFSJIkoZkFafObLliWJbzcbndjAIZhVK2kGUc8pyBp6DXPVCthALqpIZoLtwYgZaQQffUIEwtj0DPxnQeg7sOFW/B/cmF6PtjQFLYNQN1PzYXgWToH18px+IuDSGRjzQcgYep8eu4h7nzpR99qFy7ZhxkiVBhDzFSRmk3wOaEAlHYOXNlzGrtn6TyLn7b34KS9C2ftDgyUjsL7+TLU/D08MxX+jpGpbkvDALRqlHYKXGDRzR1T5yR+wpbQY++Hc/UIPD8deFC8CiUfQCz3GAkzKmgCRpJDRmmnwAWKMkOc+dvB4r2lTtz4cQGhhZvQXqvQjed8vpYV2wohg2Q19nxg5Rh3TuJTuSASRryu/0K2gIp8Js+vLzu4cxKvvEun01zW20F8fNODly98/58JA0jN6uXA3S97PsJjX985CeF3GCh5YS934de7fYg9cYoFqExhMu9nz9c/X3zfz+IVgD/WXnzQOqGoilgAWk1K+8ZfwW/z3SzM9X03T6CgHYLP5xMLQDbQqm0MXnbGy6LUOX1+zRxAOtiN8YlxsQC1irwmz6nrgnaQxWVZRnpGcAY2A6Aaun0XQ5NRyFf+iQsPYT0Ah9OFU70XMXptVPwabgVAjagYHhlG5GlkZwHqVUMAdLgZtWWAlv4tr3eg2XcboA3QBmg5wBqzkMF3sMf3AAAAAABJRU5ErkJggg==",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Part_Emit_Create (not implemented)\n`;
    }
  },
  {
    id: "ext_extra_832",
    name: "Part_Emit_Destroy",
    description: "Part_Emit_Destroy action",
    category: "extra",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAC9ElEQVR4nO2W30tTcRjGB0HXXfgHeBXd5I03UQTd9OsiiO7CCKmIEKKbJKPhStGtlMI2UCfHItzcZrqts7mznZ1zdP44NWsLXcqUzRLdBK2pF47R3NO+X7KL0Eo8J2/c4bkYvNv7ed/3ed9No9FooKag+fNDXpidnVVcOp1uZwCSJG0pQfbDH3VCkILbxmwlxQCCMgdv1LE3AKIkwvu+B9apFgRH/P8fgFTvSJjAzNfCE+veURd2DUCqZyM2NC9fQ+36eTDJR+BHfeoDkMSkck/Ejvb0PdzOl6GqcIRC2BIt8MkuiMM8jVMUgLidGq44c9L25uXrNPmlwkFcLBzAlUIJtNkzMKfuwzX5Av2yk35GGtl6LDsGIKtG3E4M17mgoxWTyknyCwUNLhcO4W7+GJozlXiVNMA52Qlf9DV42atQBySBmoy4nRiuM1lHISo2Smjym9nDePr1BmxTRnAfXAhKARq/3Sh2ZUIKMsrRmWvXz9LKSXI22o2BgYFfkoripBH0DMbQGloC83YVVhcHQRCUWUMyZzLzpm+VtHJeKl7F8BQ80TSc4c8wBuKo9y9Ay6/BMJQFN78B/XMTWA+r0CEaDhYN97I4cz1tO2l3NJNFEqCK5wuQMznwi2m402FM53LQ6fVwu93KnWLShb5Jhs6cvA/NrWFsFVThlRyaYmacZE/huPsERueWoa1vAMsq1AHp5zUkbt+8gr3hL3DEQfUmsYQn40bcGqpCeV857O8+4UFdA/p9/coBkDGQVdt0e+/gBFrk72iP5GGLp3Daew4V4lU8mzDB5PPjYUMjAnxAOYDf5RZktI6tILCwAct0CqXWUhztKUPdRwOsQgj6xwaIoqgegDQYQiS1CDEN2GcysCSGML2WQ3A8hjvV1WAYhq6oegB090VYuCA6XF6YrA5oG/WorqmB0Vg8UhynLgD5ctJiu8MOc4cZbe1t6LJ0UecTn2weKfU6oMbPMQlWQ/8MsKd/y/8WoPazD7APsA+w5wA/AI4VxNZKMDYXAAAAAElFTkSuQmCC",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Part_Emit_Destroy (not implemented)\n`;
    }
  },
  {
    id: "ext_extra_833",
    name: "Part_Emit_Burst",
    description: "Part_Emit_Burst action",
    category: "extra",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAB8ElEQVR4nO2Wv0sCYRjHD4LmBv+GaGruLygcgmiLGqSiIWgLIoikloIkiFoKtGgoKymhTM3z3kW9pXIodFKXfiyVmy523+5548Li7kp6Txc9HsTzPb6f7/N831clSZLgZEGyv+iFUqkkvLxeb2MAjDHTSqpxxLNnSDLZco1ZCQOQ1Rgi2ePWAChMQeT6BAf5DcjpePMByP1xYQv+h0Vc3B821IV/A5D789sgfC/jWKy44S8uIZGJOg9AwuT84vYI289zmKn1Ylrr4RDBwgaiahhKKsHXCQWgtPPA6TOntvteJrj4sNaJIa0DY5oLC9V+7DzNI5zbxaV6xp9hafOxNAxAW43SToELPHq5Y3JO4oOahBGtC7O1PvjKHuwXV3EXCiGaDSGhRgR1gCV5yCjtFLhAcZlDjL67uPhUtRvrr5MI5je5eMXt5u9Wo/hXCDlIJsZnvlAZ4M5J/Dx7+CWu6c+VPR7+mcqRbUhzppmvvXm48wT7PAtI8K1O3OiGcAAlJeuB29NnvoLYTfhbu+vFzboh7CimLpzm/JDZ1Tdxw7VVN4T+FlDajVPQyvXP+8IAaAy01X6238x1/X1hAFbVtAxYiZu5Fr4L7MSbcg7YQZi5bhqAAWH3fUMAtNiJ+jNAS/+W/7bA6asN0AZoA7Qc4AMd7bWEvbv6fAAAAABJRU5ErkJggg==",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Part_Emit_Burst (not implemented)\n`;
    }
  },
  {
    id: "ext_extra_834",
    name: "Part_Emit_Stream",
    description: "Part_Emit_Stream action",
    category: "extra",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAB20lEQVR4nO2Wv0sCYRjHD4LmBv+GaGruLygcgmiLGo6KhqAtiCA6ailIAqmlQIuGtJIUytQ8712qWyqHQid16cditeli983npaJB0/Pe6wj0eIYXH9/n8zzf78MpSZIEOwPS7w99UCgUhIeiKOYAGGM1I6UnkEiHkWJq3ZxaIQxA1eOIpg+dAdCYhuj1EfazXqiXib8HoO4Pc5vwPSzi9D5gagqWAaj7k9sgPMVxLJbc8OWXkLyK2Q9Ahanz09sDbD3PYabSi2mjh0MEc17E9Ai0iyTPEwpAbueGq2pOY/cUJ3jxYaMTQ0YHxgwXFsr92H6aRySzgzM9zH/DLmvLYhqAVo3cTobzPyq8Y+qcig8aEkaMLsxW+uB5k7GXX0U440csHUJSjwqaAEtxk5HbyXD+/DKHGH138eJT5W6sv0wimN1A/CYClZ3z/HpSWDIhB7mKc80XSgO8cyp+kg4gyRIN9ReyBRSkM2m+9irzzqm47VvwM7QLtWq43armK3zszXQuFOBrCscZH9e82eJCAWg1ye2OvYxIBlo1M+MXBnAXCrV8tgxAl5Xc7u9LzZ4tAXxdZlS/e5Plls5CJvD6eVkr5//lAUq2I5oGcPRveaMEu582QBugDeA4wAftfr3j+gDbWQAAAABJRU5ErkJggg==",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Part_Emit_Stream (not implemented)\n`;
    }
  },
  {
    id: "ext_extra_999_2",
    name: "-----------",
    description: "----------- action",
    category: "extra",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAATUlEQVR4nO3WzQkAIAyD0Qzf2bpWRQfwBwwifA255fCOlaRytjSPxshwEXEGyMyrBQAAAAAAAAAAAPAXoI8d3QY8fctXA3cAAADwHNAA1Q8YAMbbG0AAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: ----------- (not implemented)\n`;
    }
  },
  {
    id: "ext_extra_999_3",
    name: "CD",
    description: "CD action",
    category: "extra",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAATUlEQVR4nO3WzQkAIAyD0Qzf2bpWRQfwBwwifA255fCOlaRytjSPxshwEXEGyMyrBQAAAAAAAAAAAPAXoI8d3QY8fctXA3cAAADwHNAA1Q8YAMbbG0AAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: CD (not implemented)\n`;
    }
  },
  {
    id: "ext_extra_808",
    name: "CD_Play",
    description: "CD_Play action",
    category: "extra",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAC50lEQVR4nO2WXUhTYRjHD84PxEiEVPqAKIosCYIoCLqqbroNuolcSaEpyhCkCAtElJoIG3TWbEI6U1EDneHwYkxnuAvBaaTTkUluglrGUgc6t8W/9zmHMzHBr52DN76HhzPYgd/vfZ7n/eA4joOSAW7rhwa8Xq/sUV5evjsBh8Ox4+DyOBzNObPlN4oLnHqVjoTc5P0TeOG7jRutZ5FUHK+cQFdXF0wmE5qb29DebkFjYyuMxneCwNPvN6FxX8ddWzaSH6TKK9Df3w+e5+F0OhEIRLC0BCwsAHNzwPR0RBAg+JPhK8gbuows/ghUjxLkESB4bW0tAwdAY2VlHe7zAVNTEAQk+MPBS7hlO40sczoO52TELkAzl+A0wuGNcI9HFJDgdz6fx1XrCVy0ZCLxpQrxjxP3LkA1Hxhw4v/x+ycw+w2YZPDRUVFAgtPsCX6yLRWqkjik5KbtXcBoNMHlirA6A9EkBIG/P4Dlr0CIvb2TooAEp9kTPOV1Ao7fOxdbCUymNgwNIRqU7vAiYLc5UFioQfMHG4KLooAEF1L/XLVpT9iTgNlswcQE4HYDY2Nizf2s/gUFGrS0tMBgqIP/lyggwTMNh5B2/xj7zxC7QFNT+4aGm2TpDvmBxvoe6PU8PlmsCAdEgeyPGUitTBKWX1XVW3kE6ureC+tc6nZqOB+TWGMN+OcLEGFiWBMF4jVxwrJzucDKU8KyZ45doKOjAz09I1H48LAYEyTCSjM7I/YlCVxQXxN+j497oFarhf1Dlo1Ip+MZdDUKJxESoqzMMIFgcH15hkIhlJWVQavVyrcVW61WVFbqMDi4ugk+P8+W4/I6nDat/Px8+Q+jzs5OVFRo0d09sgHu94v7g9s9Lsyc4CSsyGnY29vLOl+P0tJnqKnh2flQz8rzBkVFxULNKe12u135+wA1F3V4dXW1EA0NDejr69v2zqDohWQnsSsB+liJ2LHAvl7Lt/tA6edA4EDgQGDfBf4B5LSgItKHjRYAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: CD_Play (not implemented)\n`;
    }
  },
  {
    id: "ext_extra_809",
    name: "CD_Stop",
    description: "CD_Stop action",
    category: "extra",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAADcklEQVR4nO2WW0yTZxjHG29cspt56cUOccv0znmxbAvRJY7NEI2JLHNuMSzZsnAYSphkGoly8LCUmZWEoqREBKMkEuWw2RFRaOuoA9bDGBTwQKRWSpG2HLqWj8Py2/t+3eo2kx1oG2543jzJd/El/9/7/J/3fR+NRqMhmYnmn5cM3G53wrO4uPj/AZjN5oRm0gACFUcYL8nCd/gjxgr24M1/j9HcnTz89B1G3n81uQD+yiIC1Sfx6w4x03YF5Z4L5U4f0y11ePPScX/4Oj9uezlxAC0tLRgMBi5evERDQzPjpVn4yw8RcXQStl7n0Zf5jB/7jF8sRsK32nDvTcGWtiF+AIvFgl6vx2q1EgotMj0NExMwdnAvobbLhLs6GPv8A4JnvyJwuoSHGSmELd8SqNFiT4uzAlK8qqpKCIeQEYn8Lj4G3v271JL7K44ymr0DZagXpb8Hz64NTJR8TNjxPY5t6+IDkDv/Q1zGwkJU/MED1EZTBp349UWM5mxHuS0AXD14d68nePITIjYTzrfWLh1Aet7ZaeXv4R8Xu78jIITHU1fOEukx4/tiD5O1Wqaqi3iUlcLsD9+p372bn1k6wJkzBuz2RUZGIFYEBX69DzM/gzt9o3rkIvabAsJEQHeAya/3M9t9jTnbDXzpz9H72lNLBzAYLmGzEcuhIWHBFLRfN5OTk8fw288z8u4mPFlpBM7rCDs7BYyFqZpj+Ha/iGfLamyvrFo6QF1dM4OD4HJBfz8MD0NQ+J+dnUd9fT3l5Xq63nyWrtSX6E5dR0/qCzi2rsW5ZQ3ON57GvmlVfBfRhQsNsYaT4nfvwnwQzp9rVcW/aTayEIpW5s+VOnHiNJWVlfFfxdXVNcL/RVVcivT1CRgBMScacPInWBRgzEVbQ/bIfdEbdjvCnnxRvbr4ARobG2ltdcbEHY5oDkoQYY3X88QBYWBgiIyMDPX+SMhjpNPphehsTFyCSCBZFY8AUJTH4vPz8xQWFqLVahP3GhqNRo4f19HdPfuEuM8njuPMY3F5aWVmZib+OW5qaqK0VMvVq86/iAeDUe9drgF151JcAidlHujo6BCdX05BwUFOndKL9+GcsKeC3Nx9quey7O3t7ckfSGRzyQ4vKytTs7a2FpPJtHwTUVJGMvlzMvI/AyzrWP5vPyR7rQCsAKwALDvAb+RR3llKAC0XAAAAAElFTkSuQmCC",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: CD_Stop (not implemented)\n`;
    }
  },
  {
    id: "ext_extra_810",
    name: "CD_Pause",
    description: "CD_Pause action",
    category: "extra",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAC7UlEQVR4nO2WXUiTURjHhxQEXURd6UVFSV3U+iIChVA0IqEozS7Ci0UUmLbYjSE1AhULJpZGE2WDdMtJeuHHcAnZvsJdCE4lnc42de/mx0qZqaA2F//Oea2tfLWP17144zk8vPDnwP93nue85zwikUgEIQOiP086wDBM1KOgoOD/ACwWS1RDMIDpZ/nwXjsF54V4vE2MW1cTDODz47uY0TyFO/Mk3iXtW1eLCkBLSwtUKhV0uno0NDRDq30N/wMJpp8/hOvqCRhT49l1a2kbArBarVAqlbDZbJifD2F2FpiaAiYnScgyyY6lcGccg+mH2VoabwBqXlVVRYznQcfCQsTc6wUmpFfgf3QL7vQjMKccgF6v52gbAqA7/2lOx/JyxHx4GBi/fR7++1kYuXwI5uS9KCx8wtF4A9Cad3TYsHpMfyI7/wi4nMDYjWQ25aOX9sNyNhatrT0cjTdAZaUKdnsIHg8QTsIS8G0UmPsABMnXe/0Mxu9chCctFu8T9rBZWa3xBlCp6tHVhXA4yY6XvwDGdgtyc2XQvWoHkyHG2M1UMOd2wXp6J3w+cDTeABpNMwYHAYcD6O9fqXmA1D8nR4a6ujpUVKgxmnYQvqwEMEk7YD2+HUND4Gi8AWprG347cC4XSXsA0Fa3obxcCX2zASMpcWDSxfAkboPpaAybqdUabwC1+iWpf4g1p+nv6yMwBOIrOYAzvUCIgPUn7IZFHIM3h0UwkLDbuRpvgMbGRrS19YTNu7tXYpCCkNJM+Dg/CAYGnJBIJOz9EZXHqKxMSUwXw+YUhALRrNADt7QUMQ8Gg5DL5VAoFNF7DQ0GA4qLy9DZucgx9/vJ7zgXMaeXVnZ2dvSf46amJhQVKdhL5lfzQGDlfnA4BtidU3MKLEg/YDKZyMkvR15ePkpLleR9qCbleQGp9B5bc5p2o9EofENCD5dGo0FJSQkbNTU1MJvNm9cRCdKS0cVCxD8DbGpb/rcFQs8tgC2ALYBNB/gOukqvTR/3HGoAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: CD_Pause (not implemented)\n`;
    }
  },
  {
    id: "ext_extra_811",
    name: "CD_Resume",
    description: "CD_Resume action",
    category: "extra",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAADN0lEQVR4nO2WW0hUURSGB3U0MRKjUrtJimWpZYihIIpWJBSVWhBSmijeUkQwxEQQMUixNJpBGSGdUMgevICTkM1N9EHw8qCjQ15nvE0plgpqavztdcQREyqdGX1xH9bLOQf+b61/7bU3j8fjwZQB3t8fWtBoNEaPnJyc7QEoFAqjhtEBpl9lQHvvMtQ3XPDJz5F7x4vjgR9tvTsA354/wXfxSwyEe+FzwGk9QPB7V1ilWJgGoL6+HiKRCFVV1dBlRmL69TP0h12CNNhFD5Cq8sf9JndYR9kaD0CpVEIgEKC1tRXz86uYnQUmU8NZFZIxEOoJGQMoLhZyAAmdPohr94ab4AjMY/iGA5B4aWkpE54HrYUFYGoKmEi+A112DAbuXoA86Aw6Oxc5ABJ/3OaFa03OcBMfxaFHxwwDoMzXxWmtrLDsJ4Hx2OvQPY3A0G1XyANPMQBwACQe1nweVyQn4VlnD8tsc1jEWu4MgDxvaWnFn2v6KzAWFcjZMHzLCQp/Bz0AiVP2JO5UbQvzNDPYRNvtDKCkRISOjlWMjAD6IiwBv4YB7QMfjCfcxEiIA5p9D6O7ew2AxCl7Erd5wceJiHM7t0AkqkZ7O/ShVjMLfgDSJgU0oR4Yiw6G5qotlN423DcC0Jc+03zTTNgRgFhch74+QKUCenqAwUFghvmfmJiK4RBnjEb4QhNwAMqLfO47AZC4vfAg7B4eN3wbVlZ+4BpOq10T7+8HlmeAd+WNGApyhOauB0b8LCBzN+MqRAC2eVbc9hMKhYYDlJW9Zf6vcuJUYvJZyyB+fmEV8bWDwsMMH8/yIGFBPUIAtO2SktJY9cSGA9TU1KCxsUsvTp1O0UcgzJqJ0S0bBL29akRGRnLzwyiTsKhIwA2ZdXECISCqyigDWFraEF9eXkZWVhby8/ONdxZIJBLk5RWhrW1xi7hOB8zNbYjT0IqPjzf+aVhbW4vc3Hw0NHRtEp+ZWZsPKlUvlzmJE7BJjmOZTMYOnGKkp2egsFDAzodyZs8bJCencJ5T2aVSqekvJNRc1OEFBQVcVFRUQC6X7/6NaLuxLQD62RTx3wB7ei3/1w+mfvYB9gH2AfYc4Df+KIYV7tdTwwAAAABJRU5ErkJggg==",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: CD_Resume (not implemented)\n`;
    }
  },
  {
    id: "ext_extra_812",
    name: "CD_If_Exists",
    description: "CD_If_Exists action",
    category: "extra",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACzklEQVR4nO2W209aQRDG/U+NiQETIo+mL/pAQjXxkhiDhao9FS8VWuCEqNUYGxJUjAVBVEBU5CJQuQjWCyFVv86eUwpGqNVzoi/uZrLhkv1+OzM7s01oqj9p4DHWaJ+HZkPxWAz/bW/U354M0VB8djb7KHsqhCziUiAeFLfZ4rBYVsFxC4KZzU7hO7kgGorz/DEMBp7EbfB6g4hG89jfz2NlJYjJSTuGh6cIJCYZoq642byF8fEvyOVyuL4GikUgkwFSKTHpDg4At7uAoSEjjMZVSRD3AHg+Qa42oVwuozJOT++KB4OA3w9sbJTR3z9KwN/lA9DpLMjn86gdl5dAIgpEasQ9HmBzk0GcQaPRygeg138WTnt1BdzckPotrWf0OQBckHiaILxeUXxnB9jbA3nMhpGRr9IBzOZVCkGA4iuKhMN0+p9A6UcZlk+zmOLmkI2UEI9WxSMRYG0tjM5OrXSAsbFFOJ0Z+HwQjEGcUTSWFjbR0tJC3tFjzu7GOXkkEBABDg9ZSHJQKBTSAThuCdvbaRwfA0dHogeKWYq3K46uLg1mZkzwew5RPIXgpYotL5+gtbVVOgDPb2N+3kV3Xsx2dspwiOJPvwccKRysp+lKANe/gEJBdD/zlMXig1KplCsJP1LBEcW3tsRsD1DWpyjmJ+Ty0nn1dtxSgpZKoKuog1b7Xh4Ajpun1fdXnOUBSzgWDhYWqk13RigUQnNzM0wmjzwAzPr6DLTuCeK7u1VxlhusIrLqyEYikYBarab/6+SrA5Vq2NtroHK8SBl+IYgnk6I4K8uFwhUcDgfa2tqoCPXBbk8+HeAPxT0ItunoqJ0E3mJg4B0mJqyYnrZicFCH9nY1VCoV5YtVejOqcUXddszzcep+6+jp4dDR0Y/u7g/UgFyydMI7AP+CeJYHiVQIWZ5ktRBsw8eYbI/SWogXe5Y/53wFeAV4BXhxgN/XwvBQ5F6b+wAAAABJRU5ErkJggg==",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: CD_If_Exists (not implemented)\n`;
    }
  },
  {
    id: "ext_extra_813",
    name: "CD_If_Playing",
    description: "CD_If_Playing action",
    category: "extra",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAADKklEQVR4nO2W60uTURzHR/OCGIlQCRUEQWREEES96lX0FwS9iWKNhg7ERW+kXuQLyRK8gNBoC215ydxq+jBUlEGMVDTY3Lxt85LOTWep05mXMdK+/c7zmM10mM9GvvE8/DjbnnG+n3N+l/OTQLLzQwN7sWjr7PZEFZ+YwD/bI9VH0RBRxZuaZvdkYiFEi0uyJEiUp8QMsat4Y6MXRmMndLpW3gyGdv43BnC9/iyScxNigogqznGT0Go5Em+E3e6CxxPAyEgAHR0u1NaaeIAHg9dwy3wBKbI00RA7ihsMvaiq+oC5uTmsrQHBIDAzA/j9QtCNjoIHUPZcQZb1MjJfHIX0fqIoiG0AHOejo9YjHA7j95if3yrucgkATPze50u4YT6DzKpjOHL3eOwAarURgUAAkWNlBfB5gLEN8b4+AYCJ3/x0HlebT+Eil4GkJ1IkKJJiA9Bo3vO7XV0F1tdJ/SfNi/TdCSyT+DRB2O0CABNnu2fip/VpkD48hFR5ungAg6GTXOCE1SqIDA/T7r8Doa9hGN814a2uGbNjIXg9AgATZ7tn4qlFiTh5+1xsLqisbEN7+wwcDvDGIBbJG+bWHsjlcjodDZpNViwtCgCbR/9YKrombAHQ6czo75/G5CQwPi6cQHAWsHV5kZ9fgPp6PfpsXxCcFwCYeIb6MNLvnIBCoYgdgOP60dLSRTkvRLuT/D7sJv/Te6fFj9HuaUoJYO2HAJD2NJlPP6PRgezs7PikoUbzhgqOIN7bS7u30WeKev8A8G2I4mFJyAwGwNIuFAJKS9UoLHwVHwCdroVmx6Y4i4OBAcEdzC1Um7YMt9sNmUwGvd4WHwBmJSVamod48cHBP+IsNlhFZNWRDZ/PB5VKRf9Xi74do9wDPhQXa6kct1HRWebFp6YEcVaWFxZWYbFYoFQqUVBQApNpSjzABsU2CLZoRYWJBJ6hrOwlamoaUFfXgPJyNXJzVcjJyaF4aYi5N4g8ih2vY47z0u3XjaIiHfLySvH8+WtUV3fRlTwRl8bkb3+I6obi0pDEChGXliwSgi24F4tbUxoJsW9t+f98DgAOAA4A9h3gFy+umN1kpXrBAAAAAElFTkSuQmCC",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: CD_If_Playing (not implemented)\n`;
    }
  },
  {
    id: "ext_extra_999_4",
    name: "---------------",
    description: "--------------- action",
    category: "extra",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAATUlEQVR4nO3WzQkAIAyD0Qzf2bpWRQfwBwwifA255fCOlaRytjSPxshwEXEGyMyrBQAAAAAAAAAAAPAXoI8d3QY8fctXA3cAAADwHNAA1Q8YAMbbG0AAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: --------------- (not implemented)\n`;
    }
  },
  {
    id: "ext_extra_999_5",
    name: "Other",
    description: "Other action",
    category: "extra",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAATUlEQVR4nO3WzQkAIAyD0Qzf2bpWRQfwBwwifA255fCOlaRytjSPxshwEXEGyMyrBQAAAAAAAAAAAPAXoI8d3QY8fctXA3cAAADwHNAA1Q8YAMbbG0AAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Other (not implemented)\n`;
    }
  },
  {
    id: "ext_extra_801",
    name: "Set_Mouse",
    description: "Set_Mouse action",
    category: "extra",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAn0lEQVR4nO3UQQ4AEQwF0B69R3MVJzExK5mRqub/2iB/g/ASVESkMdPE7r21Wis8qroHKKX80udm455AAKoSRsAAUQQUEEHAAH2HCIIC2EFAAREEFeBBwAG7iBSAhaBcgVXz6b/g3awdeITjgV9QCmA8KB0wv1sfAgLwvIt0gBdBB6TUAStWDUgBQOtAX8yIG8DMErBawO4XcAEXcBzwAH1dXLk52I0+AAAAAElFTkSuQmCC",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Set_Mouse (not implemented)\n`;
    }
  },
  {
    id: "ext_extra_807",
    name: "Open_Webpage",
    description: "Open_Webpage action",
    category: "extra",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAESUlEQVR4nO2W+0+TVxjH+VOWJYqg9QJD58QJDGOmy+Zm3A+7JjM6b+AMVTaMppMpcQQscmm5lVLaglLLxVKglJZSLhVhQwZMRZmlULm2Up0ozn32siVm/rCLvBB/8T35/vLmvOf5nOc8z/c9QUFBQSymCPr3MffgdrsXXDKZ7PkAmpqa5iWL6yrKhm501o5n3i8qgNXuoNDWSYK5j7jyy0j1DvZomtlVcnlhARwtrdi7+6kb8KLvHya7Z5gznbeJd7rZU9XNMbUJXW0zJksjNQ12TtX0LByA1dlK9S8T6PwzZPmfIAs8Yd/kb2z/+RHRrhliLJN8ZOhDY+16+k2+c2BhANpu3Mboe0DpzO8ovbOovQ+I8z5ka+8MEY0BVlT6kFycIrxymsiyYVIqOrHZmyh3LEAGGoWdX5z4FdX0YxQDU5RdHSS+f5poq5eVqj6WqW4SohslRHOHUPUoYTofUSUeskrrsTmc4gHKu66jmJql8Po4Glcvu3rv8mbVIO+eMXI408jH6dWslv/AsvwRQnIFqMIx1pfd44NzLVSYLOIA6prbSO/zoer2UNzeyyfdPmJaA0Sf0FJrbf5r8WYn6cY2QrMGCVV4kShHiVD52aS8iUxpFAdQYRMAWm9h7uhh75VxYtvvE1Y9xZoTFexW2kgocXFE0JeFLiTym6zI9rJKMUZEgY+3dFPsPq0VB2AR+ttkc3LCOUis854Q3E+ofozgQg/BCjchiiGW53hYnuVBMhc8e4xw5STrVQHeqZrhs+904mvgvOsam4RKD6vyE6K9w9I8D68cs/Oq1MySxHqWJloIPtLAMqmFEKkVSaKDsOOtxMo72ZlUIDIDjjb2NXpZV3sfSekEwfnDLMl2E/1VLkXlNagN5j+lumAmVV3L94JSNXWc1TegNFjRG83iAIzC7mPqAkRUBpBoxoUqHyFYSPfm01aqa61PF1dVu9iU2s/GjAFii4Y4YB8nRXBHxQWRXXDYdIuIqvuEnxeOQOtnZcGYcN4jLD/rZmvaZdLOt3BSf4Vo+QBrlBNEXgjwadtD8kYFl1TUcPxskTiA9y9NsjrZQliyldd1fiKK/UKgcVZljbI6Y5TX5MOEn/MSXjBFlPEeX3Q8Qu55TIrjBjsPfkuZ0SQOIMogVPT+cyRmlLNN8RNvqH2sLwqwLu8ua5V+1ub72aAPsNX8gAM/zpJxexZZQz9v75WRVVQm/ne8oWSY7dIcWts7qHN0sD/bxsaUK0RmDxFVNMmWi9N8WB9gv8NPfPU1dp4sZsdBGblaA3a7XTxAjNbDe8kGGgU/mHO82parSHPq2SzVEB2nYMtRFdu+LmDH0Ux2JaVxKlNF5SXzM4FFAcTru5Gk9/K5uodDmi4StD18k28jr7QGbbmJUqHN5mT8m+f/k+ZtRMWGOpLkZSRn6snTVs77qvZcAHOTF0P/G+CFXsv/a8Jij5cALwFeArxwgD8AGhKJEttPRT0AAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Open_Webpage (not implemented)\n`;
    }
  },
  {
    id: "ext_draw_999_1",
    name: "--------------",
    description: "-------------- action",
    category: "draw",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAATUlEQVR4nO3WzQkAIAyD0Qzf2bpWRQfwBwwifA255fCOlaRytjSPxshwEXEGyMyrBQAAAAAAAAAAAPAXoI8d3QY8fctXA3cAAADwHNAA1Q8YAMbbG0AAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: -------------- (not implemented)\n`;
    }
  },
  {
    id: "ext_draw_999_2",
    name: "Drawing",
    description: "Drawing action",
    category: "draw",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAATUlEQVR4nO3WzQkAIAyD0Qzf2bpWRQfwBwwifA255fCOlaRytjSPxshwEXEGyMyrBQAAAAAAAAAAAPAXoI8d3QY8fctXA3cAAADwHNAA1Q8YAMbbG0AAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Drawing (not implemented)\n`;
    }
  },
  {
    id: "ext_draw_501",
    name: "Draw Sprite",
    description: "Draw sprite @0",
    category: "draw",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAyElEQVR4nO2WzQ2EIBCFpxYroSJroAtPFIBtbBW2sJ49j4FINPyJYSbsGiTvIJnwvhkcEAAAOYWQH2CDcCXXPI/PALb1Q6oOQAqglEIhRCAzzwpwNV7sYqfMew6kGsCZ+8aoNdrHA/EhqgGi5jYWj4XDalwhqgBc9oF5RMuhaRjoAJLZR0ydSLcglb1vKqVMdgILwJ3puyrQ9Bt42gVf6i4oqQLrOZA9CQvM33EX/MRtWKP/AjDBHCoGaPpbfhfAPTpAB+gAzQF2Jhl+60OMYfQAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Draw Sprite (not implemented)\n`;
    }
  },
  {
    id: "ext_draw_502",
    name: "Draw Background",
    description: "Draw background @0",
    category: "draw",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABvUlEQVR4nO2WL4ykMBSHK5EjsSORI7GVSORaJMmZSiyysrK2ZhNkJeoSJHJkLWIFaoP83a8wyW0uuT9718mIm5AvvCEd3jd9jzcIIQTuCcSvD7EvwltyXl+/fE7g/e1rUp4C/yRgjPkrkgrYeYW7Yaflp5hphRkDjNZpBdx1g5k3aBLj4QM2EsUiMaaI7vu0AvoKSA8UA1CNwMt4fI5nF4Bp3XZmHHGfWqCjQMO71xOT3ohxvKYXgB4YwwZlZ8h2SF8COfb8tQ79ddmxK3Y6lkTagEJNuKgRohqQSQtrEgtcfIFcn1HamkhIXit1wLkLENwOwXoI1kZwW/J2TC/QTA1OKmMCrmrIC+Omg2iZnHUQbThQAXk3w+rEPVC5CllMWnJVFQUECn1B5bkTg8XZcuvZqUJvOLEpkgtkbXYkjgKXg7w9QboC7VSxSdUuUwwepfPpm1DIW/Lyg0R1cGpzzocOfukxLIrDSnEOpBZgoqz+kYwdn+3nztf8niMWy2o4B1I/Bax3qUt2/3dqPg3K1eh9A3/twEG8E5Y7CHyWpAIP/zv+/wTi4nvwxwIPfS3/3YJ7H0+Bp8BT4OEC3wDkac3Mh42gDQAAAABJRU5ErkJggg==",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Draw Background (not implemented)\n`;
    }
  },
  {
    id: "ext_draw_514",
    name: "Draw Text",
    description: "Draw a text",
    category: "draw",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABDElEQVR4nGNgYGD4T0v8nwE/ZAAr+v+a6njVqjzSHPD19WGq4lEHUNUBBw8d+c9gMAeOQXy6OqCtbSOKA0B8ujrAwmI62GJv77lgGsSnmwM2btoP9/nefYfhbJA4XRyQlr4MbGF4+EIwPyRkAZgPEqeLA2A+XrRoF5gPomFiNHfA1GnbsFoGEwPJ09QB7h4QiwoKVqKI5+auAIuD5GnmgF27D6FkPVwYpI4mDigrX02UA0DqaOIAmAX9E7ZgtQAkji8xUuSApUt3E5XSYWpA6qnqAFCexxe8MFxcvAqljKCKA5ArHkKVDnLJiK52eFXHw98BIMW0wEQ7YECb5YQU0BqOOmDUAaMOGHAHAAB1mBPChq+cKQAAAABJRU5ErkJggg==",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Draw Text (not implemented)\n`;
    }
  },
  {
    id: "ext_draw_519",
    name: "Draw_Text_Scaled",
    description: "Draw_Text_Scaled action",
    category: "draw",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABL0lEQVR4nO2VwQ7BQBCG95EcvQFJrxJvwIn0KVy54EKCg+BGxIEgWm/Ts/Myw2zaqlXM1KVt/rQzO93/27a7q5RSWlJa2U+FRTpg12LR/AzgEvisyhwA+vkbwL0PHYFgBTh5Z60KAyOI4+Z0EAQrQKu1jABATObmb3+Yk1gBisU+GjvOEK8QZ/YJlqujGfn+4Jt7yGcCUKtP0bBaHWNcqYwwhnwmADTiyWSLMVwpJw7Q7W2ezMJQ0C4KUCrfjVx3Hsk3GjPMQ7sYwHbnRabeK2GdBADO51fG1Ca1DpiObibtzjoZLgTBuhImjSZxn6eaEMTPnyA+mjQHPANrBNtu+NUbiG1QP/+EZGLbfm3tbLPABmAzZ12Kv9VHAFAsodQAknoL8K5A+swBcoAc4O8AV+10g6nL/clZAAAAAElFTkSuQmCC",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Draw_Text_Scaled (not implemented)\n`;
    }
  },
  {
    id: "ext_draw_511",
    name: "Draw Rectangle",
    description: "Draw a rectangle",
    category: "draw",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAjElEQVR4nO3WsQ2AIBAF0CtZwA5axnMQGyuWYA1ncAcSauuTYwA94hESvJDfkH/kVQAAAPYMwvOCWsIsnhjXNsCVD9Eo4BNgXxbcjGkKzYgB6MCz7CdmqEszooBUh3lJClCAAhQwJWDoVRy8x2AtBud4oW6Zmec5/h+Ayj3CBgz9lr8Vei8FKEABwwE3mh9FT0J0tPwAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Draw Rectangle (not implemented)\n`;
    }
  },
  {
    id: "ext_draw_516",
    name: "Draw_Gradient_Hor",
    description: "Draw_Gradient_Hor action",
    category: "draw",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAlElEQVR4nGNgYGD4T0v8nwE/ZAAr+v+a6njVqjzSHPD19WGq4lEHUOQAPoYP/2UZHv7XZzj/355h/39/hvX/Exnm/i9k6P3fzFDzfxJDzv8lDFH/tzB4/T/CYPX/GoPG/2cMEqMOGHXAqANGHTDqgFEHDCMHDHh1PPIcAFJMC0y0Awa0WU5IAa3hqANGHTDqgAF3AADwi1oZt1kJnQAAAABJRU5ErkJggg==",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Draw_Gradient_Hor (not implemented)\n`;
    }
  },
  {
    id: "ext_draw_517",
    name: "Draw_Gradient_Vert",
    description: "Draw_Gradient_Vert action",
    category: "draw",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAArElEQVR4nO3WLRMBURyF8ecTyIqu6cp2Rdd0Y0bftlnRNWnLFl2ga7qibFHka+wH8HKcOzvDnf887YRfuxcgxCzw/GhGobZXlvPPALd6by0BvgJ0uErZAD3OUjbAgKOUDZCxk7IBxlRSNsCUtZQNsGApZQMU5FI2wIqZlA2wYSJlA2wZSdkAB4ZSNsCJvpQNcKEr9TvP8f8BHuMYvQ1o9Vv+ahD7EiABEqB1wB3tIFoZReb0qQAAAABJRU5ErkJggg==",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Draw_Gradient_Vert (not implemented)\n`;
    }
  },
  {
    id: "ext_draw_512",
    name: "Draw Ellipse",
    description: "Draw an ellipse",
    category: "draw",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAB1ElEQVR4nO2Wuy+DYRTGj6+pWCoWBH+BScTUgc2lBE0JrZhESJWWNtUIymRQUdSgHaR1TweXhMRuMEgMRGISgxgUm0hEPHpaBnVp6/s+Qpo3z/Ym53duz/sSEUFOgb4+FLmEkOQKBs3JAdyF9iTV/wIotfiR3+RBlnYamXVuFOhnUTOwIj9AYZsXSs0EBF0A1HUMctyC7Feg9n0ItV5kaFyosC/IA5Br8EGh84OsF6DhB9Ao3mroHtR9CkXNDEp63ldDFABnLmjnoxnHBo6V5QzKajd0Q8vSASirxkG95/GDvyrcElW9WxoAtTkQ7flHZf9MjhsoNJMwuzfEA2Q3TIE6DxMP/iLBsAl1j188gKo+DNB/nTQAmU6Qp5+TAKBuEmS7TB4gXLWCFq94gPxmD6htL7ngzkcIjaso61sSD8AOxyYT2fNEAcIVU1S6MDi3Lc0apvMaGo8SCz7yhLTWXeQ0zkjnA2yv7HBsMvGCU8dBxK6t0+vSWjHbKzscmwzveWzPueycOQc3jG3J8xixvbLDscnwnvOq8bTzwHHPueyxmcvyHNs8W5EJLzYto8i4iHLHGpy+nZ/7D3xHfwuAL8uhhAF+9Vse74LcJwWQAkgB/DrAMzEQkJgUXlxAAAAAAElFTkSuQmCC",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Draw Ellipse (not implemented)\n`;
    }
  },
  {
    id: "ext_draw_518",
    name: "Draw_Ellipse_Gradient",
    description: "Draw_Ellipse_Gradient action",
    category: "draw",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAADIElEQVR4nO2W6UtUURjG55s1uebujOMyOq6jjmElVqRFLmWKhVZmkFppmanZYlGZGaVYuRsYGLYbFI1kShIuFVH5KQ0tNCxNU7NN587cO/B07vkDKuOOfpHD++3A+b3P+5znHJFIJIIhC6I/LxHdhHHBq6Ehc2YA0+OdgpawAP3NYFpqwTTWQNN5DdOjbbMDwDTXgo0Ih14sBbfQCazYBdwCGfS27tBlJGO676GBAMY6oDucTg51BGPqjV8WQfhuGYJvVivwwzIYU+Yq6IwV0Es8wTyqFR5Ad3w/6dYZUxZLMG4Tho8OG/FeGo8+xy3ol27GsP16TFqtJHC+0FvKoXl6QzgATed1cGJH0mUgRm3D0eu4FS9c96DV/QBa3LPR5paBLudkDEg24av1aqoQFxRCVRMEgE2Ig9bEExPWobTjdnkGbnsdQ7VPAcp8C1Hrk48HHofw0mUXBh1iyUiWU38w96oEAPjSDr21nHY/ZL8Br1xS0eCZhyLlOWT5X0RaQCmO+JWgksA0KXLQI9tORrSGAHuB3ZssAEBvI/RGEvxcvAwfJHGk+3244n0Kuf4XEKeqxLrAaiSpylGgLKJgXc4pGLGLgMZMCS4yUgCAHjU4IykFGCAA/Lx5yXNI9zGqKoQF1mCbqgL5ymLcIWN57ZKCz3aRBMAPXHiEAAAjbdCbyqj7PzlEE/Ptxi1yUKHyPNKJ/DsDypFNYEqJFxoVuXjjtANjtmupEdnUJGFMyJHgYUx9MEZm+1aWiFa3TNR7n8Al37PUC5U+Z3DX8yieu6bRm8DnAyt2hba+RBgA5n4VcbWMhs+wXRS6ZUnoIF5oUhyEmri/xT2LKvNOmkANSOfvEUjVEyyI2MR4sIvkxAtLaRbwnfJq8DB8Lgw6xGDCJhTT5gHgTJzBqC8LHMVDT8DGRtPs15j5E5mDaejwh05ar6JgNIDMifR1xQZ6jEiyactOQi/3o0GjM3aDzkRBleHEMnLtoqB5dnMWnmMSTszjOmgrTkNbnAft1WJoutWz/B/4j5oHmBEAv9kQ9c8Ac/ot/9sGQ695gHmAeYA5B/gNOsepBsTdz5wAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Draw_Ellipse_Gradient (not implemented)\n`;
    }
  },
  {
    id: "ext_draw_513",
    name: "Draw Line",
    description: "Draw a line",
    category: "draw",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAApklEQVR4nGNgYGD4T0v8nwE/ZAAr+v+a6njVqjzSHPD19WGq4lEH0NUBmVnL/2/esn9gHBAUPP8/g8Gc/ytX7qG/A2CWT568lf5RgM9ymjuAkOU0dQAxltPMAcRaThMHkGI51R1AquVUdQA5llPNAeRaThUHUGI5xQ6g1HKKHNDQuI5iy2mSDUcdQFMHgBTTAhPtgAFtlhNSQGs46oBRB4w6YMAdAAAEVWeANlUjGQAAAABJRU5ErkJggg==",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Draw Line (not implemented)\n`;
    }
  },
  {
    id: "ext_draw_515",
    name: "Draw Arrow",
    description: "Draw an arrow",
    category: "draw",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAmUlEQVR4nGNgYGD4T0v8nwE/ZAAr+v+a6njVqjzSHPD19WGq4lEHDF8HMBjMwYrpGgID7gAQDgqeP3AOgFk+efJW+jsA2XLk6KCLA9AtR04TNHcALsvpkg1JtZyqDiDHcqo5gFzLqeIASiyn2AGUWk6RAxoa11FsOU2y4agDaOoAkGJaYKIdMKDNckIKaA1HHTDqgFEHDLgDAGUVUJlNr+hpAAAAAElFTkSuQmCC",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Draw Arrow (not implemented)\n`;
    }
  },
  {
    id: "ext_draw_999_3",
    name: "----------------",
    description: "---------------- action",
    category: "draw",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAATUlEQVR4nO3WzQkAIAyD0Qzf2bpWRQfwBwwifA255fCOlaRytjSPxshwEXEGyMyrBQAAAAAAAAAAAPAXoI8d3QY8fctXA3cAAADwHNAA1Q8YAMbbG0AAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: ---------------- (not implemented)\n`;
    }
  },
  {
    id: "ext_draw_999_4",
    name: "Settings",
    description: "Settings action",
    category: "draw",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAATUlEQVR4nO3WzQkAIAyD0Qzf2bpWRQfwBwwifA255fCOlaRytjSPxshwEXEGyMyrBQAAAAAAAAAAAPAXoI8d3QY8fctXA3cAAADwHNAA1Q8YAMbbG0AAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Settings (not implemented)\n`;
    }
  },
  {
    id: "ext_draw_524",
    name: "Set Color",
    description: "Set the color",
    category: "draw",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACj0lEQVR4nO3W3UvTURjA8d0G3RZ0E+tv8KoLu/Ciuo9uJEncSIV8qbbACJutJowwAyNf13RkupjTEJFSU+fKl+ac25wZqS1t6rTai3Ovftt2J0Ulbnmzc3jgd/HA8znn95zf+QkEAgHpDAR/noJkEu6Uh1Zbuj/AttuQ0sgAUg7QPOvHarNitdqw2+cxmUz/B9A9aMDlcrHtHYLlc/C1lFhohcXFRTo6OtILmLbMgncVQj78KxqmW08y1Xkaz6Y9iVIoFOkD2M1GIpZmdrUXiMx2Eo1GWLANsPrFEX/exWg0UlhYmB7AvN3O5tQLbLdOsSw5grOnimg4SCAQwGAwMDExgUqloqCgIPUAXf8giRGKgWPyNZZBLf4fbmKxGEqlkvz8fCoqKpiZmaGrqysJslqtqQN8WlridyMSidDe3o5arWZyfDwOihKNhAmHw0mMXq9PDWBzYx1Ge6DoPPSo9yASr8Dv9xMJh4gGfex4t/jmXsPp/IxGo6GlpSUFAF09XuEJFo4fxXH10t5dCMVXHPDxfMyJsMTMWYUV7fAHzO/HqaysJDc39+AAm8XE2sBLptsa+L70MVnYE/IwsjrCnGuOoMdDQ/dbBGfUHLvYS8mTdzQ+rk02pEwmOzigpraOneBOsnCi8bZ8W0j7pAjrheRocxhzjLIw56BJo6ets4+6ujqKroh/OZIHOobV1cp4Z5vZWF9jI94Tza+ayHqURbYiG12vjuGhN7SqnyKV3EAsFlFWVpb6D5FEcp/ah/U0NTaiamhG8eAeVXfvIJfJKS4qRiQSxYuL49jq9N4FN6U1XL92m/JyCZfz8pKrlcvl//823G9kAPsCJJLTEf8MONTf8r8lpHtmABlABnDogJ9PRU6YCLHoDgAAAABJRU5ErkJggg==",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Set Color (not implemented)\n`;
    }
  },
  {
    id: "ext_draw_526",
    name: "Set_Font",
    description: "Set_Font action",
    category: "draw",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAB2UlEQVR4nO3WXUhTYRzH8SfBu2BXvkQGIYKieFME5s4QRKVQtO6iYDoUSgUpcA6GMncjmBOvRbwoCMlgs2Sac8tpQSrzZWx24YUXiaUuRWTeaPjtdEa7SEiFnUlwePjB83+eP8/5wHkOHCGEQM0g/j2E0kQk4Rkebjkf4CDyMaHRAP8nYD0tjf30dI4yMtiRsyHX33Q6ovLaYWYmyAmZ6tQDHMsPCJrNzDudhGtqoLCQDaORBYeDpU9eojfyiFRXqAcItrbGD1hsM4Mk8aPXodQvXQHu1LmolnOvxccjiwfjUzd3H4+hN41T2fyeWutE4u7AUlMTFBURsduUOuWmi1S9n4fWebLKnYiSRS4/WOPa/XHKG8bQlbxDlK2rAOiMAUrrPXT3TynzNyM+Ugw+crp2CazE+p1uP1cqRhMP2LTZTuy9eC0DJC/X278zHZhW5zPUAAsd7WAwsNXXl3zAcs9zwo1P+Jmby57VyleLhZD/bfIAIZOJ1YICVqqqCBffZjU/ny/uofj+4CuvAsi2b/M5OKPOK/g70e2p+Lx3YJJLeg9Xn60x6v+QHMCfmHt8CGkWcWskFmmORvtk8gBnjQY4F+B3sxo5M+BCf8tPa1B7aAANoAEuHPALMdoeFxk7sRMAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Set_Font (not implemented)\n`;
    }
  },
  {
    id: "ext_draw_531",
    name: "Set Full Screen",
    description: "Change full screen mode",
    category: "draw",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAA80lEQVR4nGNgYGD4T0v8nwE/ZAAr+v+a6njVqjzSHPD19WGq4lEHkO0AhuJrFGHqOCD5HFlYoPjcAIdANpVCgBxw7/1/6kUBIcAwhwED09UBIGC41gnFAeeeU9kB+OJ66/O9GCFAEwc49dzDwCBxgTkCYEtBNCwkjtHCAcjg/XdIQoNZCKL33rsHxJA0AaZp5QCY5cl7W8DiPefmgIMchEE+B1m+lRYOAFkMsxxkUfWxtWBxbJavvUbHRIjN8qXUdgAIPP8OwaAQAGFcPl9KbQcMaGU04NXxyHQASDEtMNEOGNBmOSEFtIajDhh1wKgDBtwBAIuv7GO1s7lkAAAAAElFTkSuQmCC",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Set Full Screen (not implemented)\n`;
    }
  },
  {
    id: "ext_draw_999_5",
    name: "----------------",
    description: "---------------- action",
    category: "draw",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAATUlEQVR4nO3WzQkAIAyD0Qzf2bpWRQfwBwwifA255fCOlaRytjSPxshwEXEGyMyrBQAAAAAAAAAAAPAXoI8d3QY8fctXA3cAAADwHNAA1Q8YAMbbG0AAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: ---------------- (not implemented)\n`;
    }
  },
  {
    id: "ext_draw_999_6",
    name: "Other",
    description: "Other action",
    category: "draw",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAATUlEQVR4nO3WzQkAIAyD0Qzf2bpWRQfwBwwifA255fCOlaRytjSPxshwEXEGyMyrBQAAAAAAAAAAAPAXoI8d3QY8fctXA3cAAADwHNAA1Q8YAMbbG0AAAAAASUVORK5CYII=",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Other (not implemented)\n`;
    }
  },
  {
    id: "ext_draw_802",
    name: "Take_Snapshot",
    description: "Take_Snapshot action",
    category: "draw",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAC90lEQVR4nO2WaUsbYRDH8436Adp3faNQ0RCLlBxVm2hiohbb0lYKmpgDLGkxmGDMUSXRqCQpRM1pc3rhgfetqIiC38B3/+5M3/dgI4J1lyG7z06Y38x/5tmVSCQS3KZB8vuTDpyfn5fduru7/w0gn8+X1e4nQDabRSqVQjKZZBsdDaFQKCEzM8PPygZQKBSQTmeQSCSE3zRCY+MYGh5GOBxBPJ6A3+9HT08PTCYTjEYjvD4/ej/bEfkeEw9AmVBQCuTxeBGLxbC9vY2lpSVcXV3h9PQUCwsLGBkZgcPhQHt7O5RKJbRaLZp0beIBJiYmcH19jZubG74PBAKw2WywWCwIhULw+XycfV9fH1dCr9fDYDCgq6sLL5Qa8QBOpxObm5tYXl7G8fExZ01Bw+EwotEopqamsL6+jv39fayurrIfrdEz+ctm8QAulwtHR0dc6vn5eQaYnp7GjNBok5OT2Nvb40pQ5mq1mqtB8lBTKht05QHY3d3F4eEhA1xcXDAArdEEEAgFrpZK8axaCoVCgWAwiFKpBFVjS3kASAIKODs7i7OzM86OMs9kMqy9VAj+uNGCR20ByGqfw2w2cxXqNa3l6YG1tTVsbW3xOJIc8XicAWgsrVYrqqqq8LTWgCe171FdUwO73Y6NjQ1odB3lAVhZWeFGy+Vy3GwkwcnJCQO53W7IZDJUVFSgsrIScrmcR5Uka9K/FQ/Q39+Pubk5zoj0pj2AAEgKuqaOp81HpVJBo9FgcHCQ5crnC5DXG8QDDAwMoFgssu7U9VQJKv3BwQF2dnbYlzarSCTC1bB/dUDX+g6Kxja4PEHxANRobreH53txcZEngdYo+OXlJVfB4x1Cg9BwdaoWvOm0wjM0hmQ6K0hUFA9Aunu/BdH5yShkGeV7KrPJbMMr7WvUKYWgH38FTaSyyOaE/wm9Uea3YYEz6v3iRL26Fc/lzej4YIZ3eFwI+gO5fIF9/r/vgfsLQM63YX8NcKef5X9yuO3zAeAB4AHgzgF+Ao5ip6GMJl/aAAAAAElFTkSuQmCC",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Take_Snapshot (not implemented)\n`;
    }
  },
  {
    id: "ext_draw_532",
    name: "Effect",
    description: "Effect action",
    category: "draw",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAADXklEQVR4nO3We0xTVxzA8Rtxw2TBbco2dZgokkXnY6DhMR9QEUl0WJ0wm40thCnJxA6nS3UmlpSHTrSRjqn1gdRGsJVEWqiAMMpjI4rRmc0JGMDNOgs+wqYUUh/Qr5cm/qtT2pkt3JNfcpN7kvPJuef8fj9BEAS8GQhPHoMPNpvN46FSqZ4NUF9f79H4fwFqrVZ0mV9xylKKVXw/ujeP5YETWOzvx7ZNm6ipqfEuQJ8lpy5zItasSZizY9HEj+e7GB+yQgVSJgokS+Z7GfBlGKd3TabVOBtb1Xxs1dGUb3wT5QyBtCkiYIJAjnKrZwGlxw2cOmFAr0qmQT2NFkMI12ujcHZm03tVyZncIExrX2dHmEB6sEBedpbnAEfzD7JPNo7qjEB+079H988JDPQV0n9HC/dNuPr0dJ+TclE/ix/S32ZP7Eg+mz2N6qqqoQOMRiMFX0v5VTeTzsYEun5axM2mD+nvM8DfO+l36LjVtISbp2O4UhZBaZo/28JHkBI+1TM7IJfN5cecQG6cWc7d1jU4ryvF/x5Jz6WPcHXJ6bm4TERF80f5XBp3BaKOEIgbLRA99lUsFsvQAQdUMXQ2LORy8RzsdRJuNC6i+3wcD39f5V7ccUmKvUHi/l6XEcD+xSPYPP1lvkmUeWYHNq+T0VryPgM923G0pXC7KZZ7bfHQlYrrWiJ9LSuw10q4WjFPPIhTKPx4FAUJfuQmzECRnDR0gE6zg1/0weJhM8KDEga6M8GxD5wGBm5n0Hs5kT+tkZzNe4fD0pdQhwtoPngFbZwv0qlBQwfs35tLgTKIuy1rcN03i4iT8LAcV+9hXHc0PLj1Lc6OJC4ceJeqLeMwJvlRqwpga+hIMteneeYaVlZa+F4+Xkw8c3C0fyEiyujpUHDFEkG7OQx7vYQOc4R7YdO61yj8xJf0lRLPXMPHkX9wD9LIWexODeCvZjlOu4p2UxjNhcFuRJtJQnNRMGXrx7AzahTHjui8k4o1u9Uo4idxQR/izoaDAMsGf4pXj+bkxjfQLvVhizTKu7WgsqICxadS8mVvoVvpS84CH1QhAgqxFqQuDKW4qOjf6QcqzSUoV8wje+3nHFLnoNdq3eXZ6/3A88R/CzA42RvxjwEvtC1/2gRvj2HAMGAY8MIBjwCWeWtS6tiDxQAAAABJRU5ErkJggg==",
    params: [],
    generateCode: (params: Record<string, any>) => {
      return `// External Action: Effect (not implemented)\n`;
    }
  },
];
