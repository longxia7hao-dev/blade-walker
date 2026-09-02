# 造型 BRIEF-006：手機能跑的最精緻（全包）

給：技術美術、3D 建模師、主程式（只在點名拷檔時）
覆蓋：BRIEF-005 與先前所有「已鎖 md5 不准重做」——本單重開下列進包檔。
不改戰鬥數字。kind 不變。不拷 public（主程式才拷）。

製作人錨點：**傳說對決**那種手遊精緻（好認、材質厚、手機順），不是電影光追、不是毛孔皮膚、不是方塊拼裝。
我們是手機網頁，預算比傳說對決原生引擎更緊，但觀感要往那邊靠：一整套穿在身上，有皺摺、有重量。

## 預算（TA 改 gate.py，本單即時生效）

| 類 | 檔 | 上限 |
|---|---|---|
| 武器 | frost_blade, flame_pistol, azure_staff | gzip ≤1.5MB、≤8k 三角、≤2 材質（不變） |
| 魔王 | slime_king, ghost_king, demon_king | gzip ≤4MB、≤25k、≤4 材質（不變） |
| 小魔王 | gel_shield, demon_lieutenant | raw ≤1.2MB、≤12k、≤2 材質（上調） |
| 雜兵＋場景 | slime, ghost, beetle, pumpkin, pine_tree, lamp, chest, heart_crystal | raw ≤700KB、≤8k、≤1 材質（上調） |

DARK（底色 RGB 皆 <0.1）FAIL。GLB 內 PNG FAIL。art/wip 不計進包。閘門比 md5。

## 觀感（全體）

- 當成一個完整角色／物件來做，不是配件目錄。
- 人形／有衣物：皮帶勒進布、帶子陷進皮革、袖口塞入手套、褲子塞進靴子並起皺。
- 魔物：壞可愛、金綿緣、厚實可讀材質（琥珀膠、晶簇、霧面甲殼），不是光滑積木。
- 場景：樹皮／燈籠／箱子／心晶要有重量與表面變化，遠看剪影清楚。
- 禁止：毛孔位移貼圖當主賣點、電影級 SSS、獨立懸浮配件、商店包拼裝感。
- 剪影與可讀性優先（傳說對決角色遠近都認得出是誰）。

## 造型鎖定（重做時仍要守）

- 膠盾騎 gel_shield：無騎士無冠無臉。琥珀黃膠身＋金緣圓盾（本地 −Z）＋青玉心。盾是長在身上的裝備。
- 魔軍尉 demon_lieutenant：輕甲步卒、斷角或單小角、無冠、長槍不是王杖、紅巾。遠看不能認成終王。衣服要勒進身體。
- 晶黏帝 slime_king：琥珀巢＋青晶冠，雙晶可讀。不要再變成人形。
- 雜兵 slime：南瓜金橙膠、雙晶露出。不要青藍、不要金冠（法律）。
- 武器：白霜刀、赤煙單槍、蒼焰杖。材質厚實，握把 origin。

BRIEF-005 第二波（幽魂長、甲殼副官獨立造型）本單不做，這波過完再排。

## 建模工序

一次只做一個檔。寫入 `/workspace/art/glb/<name>.glb`。gate PASS 後報一次 md5＋三角＋材質即停，等總監令下一檔。
FAIL 則修同一檔，不要開下一檔。禁止拷 public／dist。禁止 bump SW。

順序：
1. gel_shield.glb
2. demon_lieutenant.glb
3. slime_king.glb
4. slime.glb → ghost.glb → beetle.glb → pumpkin.glb
5. pine_tree.glb → lamp.glb → chest.glb → heart_crystal.glb
6. ghost_king.glb → demon_king.glb
7. frost_blade.glb → flame_pistol.glb → azure_staff.glb

## 進包

TA 閘過 → 總監點名 → 主程式只拷該檔到 public/models 與 dist/models → 品管場上 → 法律複掃。未點名不准拷。不標 SHIPPED。
