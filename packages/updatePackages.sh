for i in $(ls -p | grep "/$"); do
  cd $i;
  ncu -u
  cd ..
done
