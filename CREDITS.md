# Credits

## 3D anatomy model

The muscle model is derived from the Z-Anatomy Blender template
(https://github.com/Z-Anatomy/Models-of-human-anatomy). Attribution as the Z-Anatomy Readme asks:

- "BodyParts3D - The Database Center for Life Science - CC-BY-SA 2.1 Japan"
- "Z-Anatomy - The libre 3D atlas of anatomy - CC-BY-SA 4.0"

## Licence

Z-Anatomy content is licensed under the Creative Commons Attribution-ShareAlike 4.0 International
License (http://creativecommons.org/licenses/by-sa/4.0/). Any model derived from it, including the
glTF/GLB exported for this project, must be distributed under the same licence, CC BY-SA 4.0.

## Model file in this repo

`public/models/muscles-draco.glb` is the derived GLB (muscle layer of the Z-Anatomy male model, Draco
compressed, placeholder materials). It was produced from the Z-Anatomy `Startup.blend` with
`spike/export_muscles.py` and is distributed under CC BY-SA 4.0.

`public/models/skeleton-draco.glb` is derived from the same Z-Anatomy / BodyParts3D collection
("1: Skeletal system"), produced with `spike/export_skeleton.py`, and carries the same CC BY-SA 4.0
obligation.

## Facts sources

Cited facts in `src/facts/` come from these sources. Licences are copied as stored in `src/facts/sources.json`.

- **Anatomy of the Human Body, Twentieth Edition (1918), Myology (Internet Archive full text of the scanned book)** (Henry Gray; thoroughly revised and re-edited by Warren H. Lewis, 1918), https://archive.org/download/anatomyofhumanbo00grayrich/anatomyofhumanbo00grayrich_djvu.txt. Licence: Public domain in the US (published 1918). Internet Archive item page (https://archive.org/details/anatomyofhumanbo00grayrich) prints: Possible copyright status NOT_IN_COPYRIGHT; Copyright-region US; Copyright-evidence: visible notice of copyright; stated date is 1918. Wikimedia Commons page for this scan (File:Anatomy_of_the_Human_Body_(1918).djvu) prints: This work is in the public domain in the United States because it was published (or registered with the U.S. Copyright Office) before January 1, 1931. The book itself prints: Copyright LEA & FEBIGER 1918.
- **Free Exercise DB (dist/exercises.json)** (yuhonas (restructured from wrkout/exercises.json by Ollie Jennings), 2026), https://github.com/yuhonas/free-exercise-db. Licence: License: Unlicense (README badge); README: Open Public Domain Exercise Dataset
- **A Systematic Review of The Effects of Different Resistance Training Volumes on Muscle Hypertrophy** (Eneko Baz-Valle, Carlos Balsalobre-Fernández, Carlos Alix-Fages, Jordan Santos-Concejero, 2022), https://pmc.ncbi.nlm.nih.gov/articles/PMC8884877/. Licence: This work is licensed under the Creative Commons Attribution-NonCommercial-NoDerivatives 3.0 License.
- **Dose-response relationship between weekly resistance training volume and increases in muscle mass: A systematic review and meta-analysis** (Schoenfeld BJ, Ogborn D, Krieger JW, 2017), https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=27433992&rettype=abstract&retmode=text. Licence: no licence printed; short quotation with citation
- **Effects of Resistance Training Frequency on Measures of Muscle Hypertrophy: A Systematic Review and Meta-Analysis** (Schoenfeld BJ, Ogborn D, Krieger JW, 2016), https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=27102172&rettype=abstract&retmode=text. Licence: no licence printed; short quotation with citation
- **Greater Hamstrings Muscle Hypertrophy but Similar Damage Protection after Training at Long versus Short Muscle Lengths** (Sumiaki Maeo, Meng Huang, Yuhang Wu, et al., 2021), https://pmc.ncbi.nlm.nih.gov/articles/PMC7969179/. Licence: This is an open-access article distributed under the terms of the Creative Commons Attribution-Non Commercial-No Derivatives License 4.0 (CCBY-NC-ND)
- **Triceps surae muscle hypertrophy is greater after standing versus seated calf-raise training** (Momoka Kinoshita, Sumiaki Maeo, et al., 2023), https://pmc.ncbi.nlm.nih.gov/articles/PMC10753835/. Licence: This is an open-access article distributed under the terms of the Creative Commons Attribution License (CC BY).

Gray's Anatomy 1918 is public domain in the US. OpenStax Anatomy & Physiology was evaluated and NOT used because its terms forbid use in AI systems.
