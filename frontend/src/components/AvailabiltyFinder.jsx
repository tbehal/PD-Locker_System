import React, { useState, useCallback } from 'react';
import { findCombinations, fetchGrid, bookSlot } from '../api';

const SearchCriteriaForm = ({ criteria, onInputChange, onSearch, isLoading }) => (
    <form onSubmit={(e) => { e.preventDefault(); onSearch(); }} className="space-y-4">
        <div>
            <label htmlFor="shift" className="block text-sm font-medium text-gray-700">Shift</label>
            <select id="shift" name="shift" value={criteria.shift} onChange={onInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                <option value="AM">AM</option>
                <option value="PM">PM</option>
            </select>
        </div>
        <div>
            <label htmlFor="startWeek" className="block text-sm font-medium text-gray-700">Start Week</label>
            <select id="startWeek" name="startWeek" value={criteria.startWeek} onChange={onInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                {Array.from({ length: 12 }, (_, i) => i + 1).map(week => <option key={`start-${week}`} value={week}>{week}</option>)}
            </select>
        </div>
        <div>
            <label htmlFor="endWeek" className="block text-sm font-medium text-gray-700">End Week</label>
            <select id="endWeek" name="endWeek" value={criteria.endWeek} onChange={onInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                {Array.from({ length: 12 - criteria.startWeek + 1 }, (_, i) => criteria.startWeek + i).map(week => <option key={`end-${week}`} value={week}>{week}</option>)}
            </select>
        </div>
        <div>
            <label htmlFor="weeksNeeded" className="block text-sm font-medium text-gray-700">Consecutive Weeks Needed</label>
            <input type="number" name="weeksNeeded" id="weeksNeeded" value={criteria.weeksNeeded} onChange={onInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" min="1" />
        </div>
        <div>
            <label htmlFor="level" className="block text-sm font-medium text-gray-700">Priority Level</label>
            <select id="level" name="level" value={criteria.level} onChange={onInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                <option value={1}>Level 1 (LAB A, B, C, E priority)</option>
                <option value={2}>Level 2 (LAB B9, D priority)</option>
            </select>
        </div>
        <button type="submit" disabled={isLoading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400">
            {isLoading ? 'Searching...' : 'Find Lab Availability'}
        </button>
    </form>
);

const BookingSection = ({ traineeName, onTraineeNameChange, onBook, isBooking, selectedCombination, error, successMessage }) => (
    <div>
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Book Lab Slot</h2>
        <div className="space-y-4">
            {error && <p className="text-sm text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
            {successMessage && <p className="text-sm text-green-600 bg-green-100 p-3 rounded-md">{successMessage}</p>}
            <div>
                <label htmlFor="traineeName" className="block text-sm font-medium text-gray-700">Trainee Name</label>
                <input type="text" id="traineeName" value={traineeName} onChange={onTraineeNameChange} placeholder="Enter trainee name" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
            </div>
            <button onClick={onBook} disabled={!selectedCombination || !traineeName || isBooking} className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors duration-200 ${selectedCombination && traineeName && !isBooking ? 'bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-offset-2 focus:ring-green-500' : 'bg-gray-400 cursor-not-allowed'}`}>
                {isBooking ? 'Booking...' : 'Book Selected Slot'}
            </button>
            {selectedCombination && (
                <div className="pt-2">
                    <p className="text-sm text-slate-600">
                        Selected: <span className="font-semibold text-slate-800">{selectedCombination.lab} - Station {selectedCombination.station}</span> for weeks {selectedCombination.weeks.join(', ')}.
                    </p>
                </div>
            )}
        </div>
    </div>
);

const SearchResults = ({ results, selected, onSelect, isLoading }) => (
    <div className="bg-white rounded-xl shadow-md border border-gray-200">
        <h2 className="text-xl font-semibold text-slate-800 p-4 border-b border-gray-200">Ranked Lab Availabilities ({results.length})</h2>
        <div className="max-h-96 overflow-y-auto">
            {results.length > 0 ? (
                <div className="p-2 space-y-2">
                    {results.map((combo) => (
                        <button key={combo.id} onClick={() => onSelect(combo)} className={`w-full text-left p-3 rounded-lg transition-colors duration-200 ${selected?.id === combo.id ? 'bg-indigo-50 ring-2 ring-indigo-500' : 'bg-gray-50 hover:bg-gray-100'}`}>
                            <p className="font-semibold text-slate-800">{combo.lab} - Station {combo.station}</p>
                            <p className="text-sm text-slate-600">Weeks: {combo.weeks.join(', ')}</p>
                        </button>
                    ))}
                </div>
            ) : (
                <p className="p-4 text-slate-500">{isLoading ? 'Loading results...' : 'No lab availability results found. Try adjusting your search criteria.'}</p>
            )}
        </div>
    </div>
);

const AvailabilityGrid = ({ data, selectedCombination }) => (
    <div className="bg-white rounded-xl shadow-md border border-gray-200">
        <h2 className="text-xl font-semibold text-slate-800 p-4 border-b border-gray-200">Availability Grid: {data.lab} ({data.shift})</h2>
        <div className="overflow-x-auto p-2">
            <table className="min-w-full border-collapse text-center">
                <thead>
                    <tr>
                        <th className="p-2 text-left text-sm font-semibold text-gray-600">Station</th>
                        {data.weeks.map(week => <th key={week} className="p-2 text-sm font-semibold text-gray-600">W{week}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {data.grid.map(row => (
                        <tr key={row.station} className="odd:bg-white even:bg-gray-50">
                            <td className={`p-2 border border-gray-200 font-bold ${selectedCombination?.station === row.station ? 'text-indigo-600' : 'text-slate-700'}`}>{row.station}</td>
                            {row.availability.map((status, index) => {
                                const week = data.weeks[index];
                                const isSelected = selectedCombination?.station === row.station && selectedCombination?.weeks.includes(week);
                                return (
                                    <td key={index} className={`p-2 border border-gray-200 font-mono text-sm transition-colors duration-200 ${isSelected ? 'bg-indigo-500 text-white font-bold' : (status === '✓' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')}`}>
                                        {status}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);


export default function AvailabilityFinder() {
    const [searchCriteria, setSearchCriteria] = useState({ shift: 'AM', startWeek: 1, endWeek: 12, weeksNeeded: 2, level: 1 });
    const [results, setResults] = useState([]);
    const [selectedCombination, setSelectedCombination] = useState(null);
    const [gridData, setGridData] = useState(null);
    const [traineeName, setTraineeName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isBooking, setIsBooking] = useState(false);
    const [error, setError] = useState(null);
    const [bookingSuccess, setBookingSuccess] = useState('');

    const handleInputChange = (e) => {
        const { name, value, type } = e.target;
        const newValue = type === 'number' ? parseInt(value, 10) : value;
        
        setSearchCriteria(prev => {
            const updated = { ...prev, [name]: newValue };
            
            // If startWeek changed, ensure endWeek is valid
            if (name === 'startWeek') {
                const startWeek = newValue;
                const endWeek = prev.endWeek;
                
                // If endWeek is less than startWeek, set it to startWeek
                if (endWeek < startWeek) {
                    updated.endWeek = startWeek;
                }
            }
            
            return updated;
        });
    };

    const handleSearch = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setBookingSuccess('');
        setResults([]);
        setSelectedCombination(null);
        setGridData(null);
        try {
            const combinations = await findCombinations(searchCriteria);
            setResults(combinations);
        } catch (err) {
            setError('Failed to search for availability. Please try again.');
        }
        setIsLoading(false);
    }, [searchCriteria]);

    const handleSelectCombination = useCallback(async (combination) => {
        setSelectedCombination(combination);
        setGridData(null);
        try {
            const newGridData = await fetchGrid(combination.lab, combination.shift);
            setGridData(newGridData);
        } catch (err) {
            setError('Failed to load availability grid.');
        }
    }, []);

    const handleBookSlot = async () => {
        if (!selectedCombination || !traineeName) {
            setError("Please select a slot and enter a trainee name to book.");
            return;
        }
        setIsBooking(true);
        setError(null);
        setBookingSuccess('');
        try {
            await bookSlot({ ...selectedCombination, traineeName });
            setBookingSuccess(`Successfully booked ${selectedCombination.lab} - Station ${selectedCombination.station} for ${traineeName}.`);
            setSelectedCombination(null);
            setTraineeName('');
            setGridData(null);
            await handleSearch(); // Refresh data
        } catch (err) {
            setError(err.response?.data?.error || 'An unexpected error occurred during booking.');
        }
        setIsBooking(false);
    };

    return (
        <div className="bg-gray-50 min-h-screen font-sans p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Lab Availability Manager</h1>
                    <p className="text-slate-600 mt-1">Find and book available lab stations for trainees.</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 space-y-8">
                        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                            <h2 className="text-xl font-semibold text-slate-800 mb-4">Search Criteria</h2>
                            <SearchCriteriaForm criteria={searchCriteria} onInputChange={handleInputChange} onSearch={handleSearch} isLoading={isLoading} />
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                            <BookingSection
                                traineeName={traineeName}
                                onTraineeNameChange={e => setTraineeName(e.target.value)}
                                onBook={handleBookSlot}
                                isBooking={isBooking}
                                selectedCombination={selectedCombination}
                                error={error}
                                successMessage={bookingSuccess}
                            />
                        </div>
                    </div>

                    <div className="lg:col-span-2 space-y-8">
                        <SearchResults results={results} selected={selectedCombination} onSelect={handleSelectCombination} isLoading={isLoading} />
                        {gridData && <AvailabilityGrid data={gridData} selectedCombination={selectedCombination} />}
                    </div>
                </div>
            </div>
        </div>
    );
}
