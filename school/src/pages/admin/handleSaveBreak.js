const handleSaveBreak = async (e) => {
  e.preventDefault();
  try {
    setLoading(true);
    if (!schoolTiming) {
      setError('School timing must be configured before adding breaks');
      return;
    }
    
    // Make sure all required fields are present and properly formatted
    const payload = {
      school_timing_id: schoolTiming.id,
      break_type: formState.break_type || 'short',
      start_time: formState.start_time,
      duration: parseInt(formState.duration) || 10,
      order: parseInt(formState.order) || (breaks.length + 1)
    };
    
    console.log('Sending break payload:', payload);
    
    if (editingItem) {
      const response = await api.put(`/breaks/${editingItem.id}/`, payload);
      setBreaks(prev => prev.map(b => b.id === editingItem.id ? response.data : b));
    } else {
      const response = await api.post('/breaks/', payload);
      setBreaks(prev => [...prev, response.data]);
    }
    setShowForm(null);
    setEditingItem(null);
    setFormState({});
  } catch (err) {
    setError('Failed to save break: ' + (err.response?.data?.detail || err.message || 'Unknown error'));
  } finally {
    setLoading(false);
  }
};