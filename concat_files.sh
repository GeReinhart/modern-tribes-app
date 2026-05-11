export LC_ALL=en_US.UTF-8
find $1 -type f | while IFS= read -r file; do
  echo "----------------------------------------"
  echo "File: $file"
  echo "----------------------------------------"
  iconv -f UTF-8 -t UTF-8 "$file" 2>/dev/null || cat "$file"
  echo -e "\n"
done > output.txt