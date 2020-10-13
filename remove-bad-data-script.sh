
removestring="711231/1200"
for infile in *.csv; 
do 
    echo "$infile"; 
    `grep -v $removestring $infile > tmp.tmp`; 
    mv tmp.tmp $infile; 
done

